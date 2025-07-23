import { Request, RequestHandler, Response } from 'express';
import  * as UserService from '../services/user';
import { getUserCognitoData, handleRefreshTokenFlow } from '../utils';
export const getUser = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ error: "User is not logged in" });
      return;
    }
    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;

    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    const userSk = userCognitoData.sub;
    const user = await UserService.getUser(userSk);
    res.status(200).json(user);
  } catch (error: any) {
    console.error("Error from route:", error.message || error);
    res.status(400).json({ error: "An error occurred when trying to get the user" });
  }
};

export const getUserVoted = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ error: "User is not logged in" });
      return; 
    }
    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;
    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    const userSk = userCognitoData.sub;
    const user = await UserService.getUser(userSk);

    if (!user) {
      res.status(404).json({ message: `User with sk ${userSk} not found.` });
      return 
    }
    
    res.status(200).json(user.voted_sk);
  } catch (error: any) {
    console.error("Error from route:", error.message || error);
    res.status(400).json({ error: "Could not get user's voted artwork" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, f_name, l_name, birthdate } = req.body;
  const userData = { email, password, f_name, l_name, birthdate };

  try {
    const result = await UserService.registerUser(userData);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Registration failed" });
  }
};

export const verifyUser = async (req: Request, res: Response) => {
    const { email, verificationCode } = req.body;
    try {
      const userInfo = await UserService.getStatusAndSubFromId(email);
  
      if (!userInfo?.sub) {
        res.status(400).json({ error: "User sub is missing." });
        return
      }
  
      const user = await UserService.verifyUser(userInfo.sub, email, verificationCode);
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Registration failed" });
    }
  };


export const sendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const response = await UserService.sendVerificationEmail(email);
    if (response.$metadata?.httpStatusCode === 200) {
      res.status(200).json({ message: "Verification email resent successfully" });
    } else {
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
};

export const getAuthStatus = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ message: "User is not logged in" });
      return
    }
    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;
    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    if (userCognitoData?.sub) {
      res.status(200).json({ message: userCognitoData.sub });
    } else {
      res.status(400).json({ error: "User ID not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Authentication failed" });
  }
};

export const getVolunteerAuthStatus = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ message: "User is not logged in" });
      return;
    }
    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;

    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    if (userCognitoData?.nickname === "Volunteer") {
      res.status(200).json({ message: "Authenticated as a volunteer." });
    } else {
      res.status(400).json({ error: "User is not a volunteer." });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Authentication failed" });
  }
};

// export const refundUser = async (req: Request, res: Response) => {
//   const userSk = req.params.userSk;

//   if (!req.cookies.accessToken) {
//     res.status(401).json({ error: "No access token provided" });
//     return;
//   }

//   try {
//     const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
//     const userNick = userCognitoData.nickname;

//     if (userNick === "Volunteer") {
//       const result = await UserService.refundUser(userSk);
//       res.status(200).json(result);
//     } else {
//       res.status(403).json({ error: "User is not authenticated as a volunteer." });
//     }
//   } catch (error) {
//     console.error("Error getting user Cognito data:", error);
//     res.status(500).json({ error: "Error authenticating user" });
//   }
// };

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const response = await UserService.login(email, password);

    if (!response) {
        res.status(401).json({ error: "Login failed. No response from Cognito." });
        return;
      }
  
    const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response;
    let sameSiteValue: "lax" | "Strict" | "None" = "lax";

    res.cookie("accessToken", AccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: sameSiteValue,
      maxAge: (ExpiresIn ?? 3600) * 1000,
    });
    res.cookie("idToken", IdToken, {
      httpOnly: true,
      secure: true,
      sameSite: sameSiteValue,
      maxAge: (ExpiresIn ?? 3600) * 1000,
    });
    res.cookie("refreshToken", RefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: sameSiteValue,
      maxAge: 86400000,
    });
    res.status(201).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Login failed" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ message: "User is not logged in" });
      return;
    }

    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;

    res.clearCookie("accessToken");
    res.clearCookie("idToken");
    res.clearCookie("refreshToken");

    if (req.cookies.accessToken) {
      await UserService.logout(req.cookies.accessToken);
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
      const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
      const userSk = userCognitoData.sub;
  
      const authHeader = req.headers.authentication;
  
      let token: string | undefined;
      if (typeof authHeader === "string") {
        token = authHeader.split(" ")[1];
      } else if (Array.isArray(authHeader)) {
        token = authHeader[0].split(" ")[1]; // optional: support multiple header values
      }
  
      if (!token) {
        res.status(401).json({ error: "Missing or invalid authentication token." });
        return;
      }
  
      await UserService.deleteUser(userSk, token);
      res.status(204).send();
    } catch (error) {
      console.error("error deleting user:", error);
      res.status(400).json({ error: "Error deleting user" });
    }
  };
  
export const userDeleteAccount = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      res.status(401).json({ message: "User is not logged in" });
      return;
    }

    await handleRefreshTokenFlow(req, res);
    if (res.headersSent) return;

    const userCognitoData = await getUserCognitoData(accessToken);
    const userSk = userCognitoData.sub;
    const userEmail = userCognitoData.email;
    const result = await UserService.userDeleteAccount(userSk, userEmail);

    if (result.success) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(200).json({ message: "Account successfully deleted" });
    } else {
      res.status(400).json({ error: "Error deleting account" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error while deleting account" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const forgotPasswordResponse = await UserService.forgotPassword(req.body.email);
    res.status(200).json(forgotPasswordResponse);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to initiate forgot password flow" });
  }
};

export const confirmForgotPassword = async (req: Request, res: Response) => {
  const { confirmationCode, password, email } = req.body;

  try {
    const result = await UserService.confirmForgotPassword({ confirmationCode, password, email });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to reset password" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    const userSk = userCognitoData.sub;
    const updatedUser = await UserService.updateUser(userSk, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update user" });
  }
};

export const volunteerUpdateUser = async (req: Request, res: Response) => {
  const userSk = req.params.userSk;

  if (!req.cookies.accessToken) {
    res.status(401).json({ message: "No access token provided" });
    return;
  }

  try {
    const userCognitoData = await getUserCognitoData(req.cookies.accessToken);
    if (userCognitoData.nickname === "Volunteer") {
      const updatedUser = await UserService.volunteerUpdateUser(userSk, req.body);
      res.status(200).json(updatedUser);
    } else {
      res.status(403).json({ error: "User is not authenticated as a volunteer." });
    }
  } catch (error) {
    console.error("Error getting user Cognito data:", error);
    res.status(500).json({ error: "Error authenticating user" });
  }
};
