import { UserModel } from '../models/user';

export class UserService {
  static async registerUser({ email, password, f_name }: any) {
    const signup = await UserModel.createCognitoUser(email, password, f_name);
    const sk = await UserModel.createUser(signup, { email, password, f_name });
    return { userSk: sk };
  }

  static async login(email: string, password: string) {
    const result = await UserModel.signIn(email, password);
    return result.AuthenticationResult;
  }

  static async getUser(userSk: string) {
    const result = await UserModel.getUserBySk(userSk);
    return result.Item;
  }
}