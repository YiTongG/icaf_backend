import {
    CognitoIdentityProviderClient,
    GetUserCommand,
  } from "@aws-sdk/client-cognito-identity-provider";
  import { Request, Response } from "express";
  import { UserModel } from "./models/user";
  
  const client = new CognitoIdentityProviderClient({});
  
  interface CognitoAttributes {
    [key: string]: string;
  }
  
  export async function getUserCognitoData(authToken: string): Promise<CognitoAttributes> {
    try {
      const command = new GetUserCommand({ AccessToken: authToken });
      const response = await client.send(command);
      const userAttributes = response.UserAttributes?.reduce<CognitoAttributes>((acc, attribute) => {
        if (attribute.Name && attribute.Value !== undefined) {
          acc[attribute.Name] = attribute.Value;
        }
        return acc;
      }, {}) || {};
  
      return userAttributes; // userAttributes.sub = UUID
    } catch (error) {
      throw new Error("Unauthorized");
    }
  }
  
  export async function handleRefreshTokenFlow(req: Request, res: Response): Promise<void> {
    if (req.cookies.accessToken) {
      try {
        const userAttributes = await getUserCognitoData(req.cookies.accessToken);
        if (userAttributes) return; // Continue with endpoint execution
      } catch (e) {
        // accessToken may be expired or invalid; proceed to refresh
      }
    }
  
    await refreshAccessToken(req, res);
  }
  
  async function refreshAccessToken(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).send({ message: "Missing authentication credentials." });
      return;
    }
  
    try {
      const newTokens = await UserModel.getNewTokens(refreshToken);
      const result = newTokens.AuthenticationResult;

      if (!result) {
        throw new Error("No authentication result returned from Cognito");
      }
      
      const { AccessToken, IdToken, RefreshToken, ExpiresIn } = result;
        
      if (AccessToken && IdToken) {
        res.cookie("accessToken", AccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: (ExpiresIn ?? 3600) * 1000,
        });
        res.cookie("idToken", IdToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: (ExpiresIn ?? 3600) * 1000,
        });
  
        req.cookies.accessToken = AccessToken;
        req.cookies.idToken = IdToken;
  
        if (RefreshToken) {
          res.cookie("refreshToken", RefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 86400000,
          });
          req.cookies.refreshToken = RefreshToken;
        }
  
        return;
      }
  
      res.status(401).send({ message: "Authentication failed. Please log in again." });
    } catch (error) {
      res.status(401).send({ message: "Failed to refresh access token." });
    }
  }
  