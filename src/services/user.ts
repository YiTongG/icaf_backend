import { UserModel } from "../models/user";
import { ArtworkService } from "./artwork";

interface UserData {
  email: string;
  password: string;
  f_name: string;
  l_name?: string;
  birthdate?: string;
}

interface ConfirmForgotPasswordArgs {
  email: string;
  password: string;
  confirmationCode: string;
}
export const UserService = {
  async logout(accessToken: string) {
    return await UserModel.globalSignOut(accessToken);
  }
}
export async function getUser(userSk: string) {
  const user = await UserModel.getUserBySk(userSk);
  return user.Item;
}

export async function registerUser(userData: UserData) {
  const { email, password, f_name } = userData;
  const signUpResult = await UserModel.createCognitoUser(email, password, f_name);
  if (!signUpResult.UserSub) {
    throw new Error("UserSub is missing from Cognito signup result");
  }
  const uuid = await UserModel.createUser(signUpResult.UserSub, userData);
  return { message: uuid };
}

export async function updateUserPaymentStatus(userSk: string, updateValue: boolean, pi_id: string) {
  if (updateValue === true) {
    return await UserModel.updateUserSuccessfulPaymentStatus(userSk, pi_id);
  }
}

export async function verifyUser(uuid: string, email: string, verificationCode: string) {
  await UserModel.confirmCognitoUser(email, verificationCode);
  await UserModel.updateUserById(uuid, "can_submit_art", true);
  return { message: "verified" };
}

export async function login(email: string, password: string) {
  const authResponse = await UserModel.signIn(email, password);
  return authResponse.AuthenticationResult;
}

export async function logout(accessToken: string) {
  return await UserModel.globalSignOut(accessToken);
}

export async function deleteUser(userSk: string, token: string) {
  await UserModel.deleteCognitoUser(token);
  await UserModel.deleteUserData(userSk);
  await ArtworkService.deleteArtwork(userSk);
}

export async function userDeleteAccount(userSk: string, userEmail: string) {
  try {
    try {
      //TODO: delete compeltily from de
      await ArtworkService.deleteArtwork(userSk);
    } catch (artworkError: any) {
      console.log("Error deleting artwork during account deletion:", artworkError.message);
    }

    await UserModel.deleteUserData(userSk);
    await UserModel.deleteCognitoUserDetails(userEmail);
    await UserModel.disableUser(userEmail);

    return { success: true, message: "Account successfully deleted" };
  } catch (error) {
    console.error("Error in userDeleteAccount:", error);
    throw error;
  }
}

export async function forgotPassword(username: string) {
  return await UserModel.forgotPassword(username);
}

export async function confirmForgotPassword(reqArgs: ConfirmForgotPasswordArgs) {
  return await UserModel.confirmForgotPassword(reqArgs);
}

export async function updateUser(userSk: string, updateField: Record<string, any>) {
  const fieldName = Object.keys(updateField)[0];
  const fieldValue = updateField[fieldName];

  const allowedFields = ["g_f_name", "g_l_name"];

  if (allowedFields.includes(fieldName)) {
    try {
      const user = await UserModel.updateUserById(userSk, fieldName, fieldValue);

      if (!user.Attributes) {
        throw new Error(`No attributes returned when updating user ${userSk}`);
      }

      const { pk, sk, ...formattedUser } = user.Attributes;
      return formattedUser;
    } catch (error) {
      console.error(`Error updating user ${userSk}:`, error);
      throw error;
    }
  } else {
    throw new Error("Field is not available for user modification.");
  }
}

export async function refundUser(userSk: string) {
  const userData = await UserModel.getUserBySk(userSk);

  if (!userData.Item) {
    throw new Error(`User not found with sk: ${userSk}`);
  }

  return await UserModel.refundUser(userData.Item.pi_id);
}

export async function volunteerUpdateUser(userSk: string, updateField: Record<string, any>) {
  const fieldName = Object.keys(updateField)[0];
  const fieldValue = updateField[fieldName];

  const allowedFields = ["can_submit_art"];

  if (!allowedFields.includes(fieldName)) {
    throw new Error("Field is not available for volunteer modification.");
  }

  try {
    const user = await UserModel.updateUserById(userSk, fieldName, fieldValue);

    if (!user.Attributes) {
      throw new Error(`No attributes returned when updating user ${userSk}`);
    }

    const { pk, sk, ...formattedUser } = user.Attributes;
    return formattedUser;
  } catch (error) {
    console.error(`Error updating user ${userSk}:`, error);
    throw error;
  }
}

export async function getStatusAndSubFromId(email: string) {
  return await UserModel.getStatusAndSubFromId(email);
}

export async function sendVerificationEmail(email: string) {
  return await UserModel.sendVerificationEmail(email);
}
