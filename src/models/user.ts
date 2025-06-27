import { v4 as uuidv4 } from 'uuid';

export interface User {
  sk: string;
  pk: string;
  f_name: string;
  l_name?: string;
  birthdate?: string;
  location?: string;
  age?: number;
  email: string;
  g_f_name?: string;
  g_l_name?: string;
  voted_sk?: string;
  can_submit_art: boolean;
  has_active_submission: boolean;
  has_paid?: boolean;
  pi_id?: string;
  password?: string;
  verified?: boolean;
}

export const users: Record<string, User> = {};
const verificationCodes: Record<string, string> = {};
const defaultCode = '123456';

import { ddbDocClient } from "../lib/dynamoDBClient";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";
import {
  SignUpCommand,
  ConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  AuthFlowType,
  InitiateAuthCommand,
  DeleteUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  AdminGetUserCommand,
  ResendConfirmationCodeCommand,
  AdminDeleteUserAttributesCommand,
  AdminDisableUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SK!, {
  apiVersion: "2025-05-28.basil",
});

let tableName = process.env.DYNAMO_TABLE_NAME!;
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = `${tableName}-${process.env.ENV}`;
}

const userPoolId = process.env.COGNITO_USERPOOL_ID!;
const clientId = process.env.COGNITO_CLIENT_ID!;
const client = new CognitoIdentityProviderClient({});

export const UserModel = {
  async getUserBySk(userSk: string) {
    if (!userSk || typeof userSk !== "string" || userSk.length <= 5) {
      throw new Error("Invalid userSk");
    }

    const input = {
      TableName: tableName,
      Key: { pk: "USER", sk: userSk },
      ProjectionExpression:
        "sk, f_name, l_name, birthdate, #loc, age, email, g_f_name, g_l_name, voted_sk, can_submit_art, has_active_submission, has_paid, pi_id",
      ExpressionAttributeNames: { "#loc": "location" },
    };

    return await ddbDocClient.send(new GetCommand(input));
  },

  async createCognitoUser(email: string, password: string, f_name: string) {
    const command = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "given_name", Value: f_name }],
    });

    return await client.send(command);
  },

  async createUser(signUpResult: any, userDetails: any) {
    const user = {
      pk: "USER",
      sk: signUpResult.UserSub,
      f_name: userDetails.f_name,
      l_name: userDetails.l_name,
      birthdate: userDetails.birthdate,
      has_active_submission: false,
      can_submit_art: false,
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: user,
      })
    );

    return user.sk;
  },

  async confirmCognitoUser(email: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    });

    return await client.send(command);
  },

  async signIn(email: string, password: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: { USERNAME: email, PASSWORD: password },
      ClientId: clientId,
    });

    return await client.send(command);
  },

  async getNewTokens(refreshToken: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
      ClientId: clientId,
    });

    return await client.send(command);
  },

  async globalSignOut(accessToken: string) {
    const command = new GlobalSignOutCommand({ AccessToken: accessToken });
    return await client.send(command);
  },

  async deleteCognitoUser(token: string) {
    return await client.send(new DeleteUserCommand({ AccessToken: token }));
  },

  async deleteCognitoUserDetails(email: string) {
    const command = new AdminDeleteUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributeNames: ["given_name"],
    });

    return await client.send(command);
  },

  async disableUser(email: string) {
    const command = new AdminDisableUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await client.send(command);
  },

  async forgotPassword(username: string) {
    const command = new ForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
    });

    return await client.send(command);
  },

  async confirmForgotPassword({
    email,
    confirmationCode,
    password,
  }: {
    email: string;
    confirmationCode: string;
    password: string;
  }) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: password,
    });

    return await client.send(command);
  },

  async getStatusAndSubFromId(username: string) {
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });

    const response = await client.send(command);
    const sub = response.UserAttributes?.find((attr) => attr.Name === "sub")?.Value;

    return { status: response.UserStatus, sub };
  },

  async sendVerificationEmail(email: string) {
    const command = new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: email,
    });

    return await client.send(command);
  },

  async deleteUserData(userSk: string) {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: "USER", sk: userSk },
      })
    );
  },

  async refundUser(pi_id: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(pi_id);

    const refund = await stripe.refunds.create({
      payment_intent: pi_id,
      amount: paymentIntent.amount,
    });

    if (refund.status === "succeeded") {
      return refund.id;
    } else {
      throw new Error(`Refund failed with status: ${refund.status}`);
    }
  },

  async updateUserSuccessfulPaymentStatus(userSk: string, pi_id: string) {
    const input = {
      TableName: tableName,
      Key: { pk: "USER", sk: userSk },
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      UpdateExpression: "SET has_paid = :hasPaid, pi_id = :piId",
      ExpressionAttributeValues: {
        ":hasPaid": true,
        ":piId": pi_id,
      },
      ReturnValues: ReturnValue.ALL_NEW,
    };

    return await ddbDocClient.send(new UpdateCommand(input));
  },

  async updateUserById(userSk: string, fieldName: string, fieldValue: any) {
    const input = {
      TableName: tableName,
      Key: { pk: "USER", sk: userSk },
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      UpdateExpression: "set #fieldName = :fieldValue",
      ExpressionAttributeNames: { "#fieldName": fieldName },
      ExpressionAttributeValues: { ":fieldValue": fieldValue },
      ReturnValues: ReturnValue.ALL_NEW,
    };

    return await ddbDocClient.send(new UpdateCommand(input));
  },
};