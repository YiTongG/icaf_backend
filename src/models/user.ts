const { v4: uuidv4 } = require('uuid');


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

export const UserModel = {
  async getUserBySk(userSk: string) {
    if (!users[userSk]) throw new Error('User not found');
    return { Item: users[userSk] };
  },

  async createCognitoUser(email: string, password: string, f_name: string) {
    const userSk = uuidv4();
    users[userSk] = {
      sk: userSk,
      pk: "USER",
      email,
      f_name,
      can_submit_art: false,
      has_active_submission: false,
      password,
      verified: false,
    };
    verificationCodes[email] = defaultCode;
    return { UserSub: userSk };
  },

  async createUser(signUpResult: any, userDetails: Partial<User>) {
    const sk = signUpResult.UserSub;
    users[sk] = {
      ...users[sk],
      ...userDetails,
      sk,
      pk: 'USER',
      can_submit_art: false,
      has_active_submission: false,
    };
    return sk;
  },

  async confirmCognitoUser(email: string, verificationCode: string) {
    const user = Object.values(users).find((u) => u.email === email);
    if (!user) throw new Error('User not found');
    if (verificationCodes[email] !== verificationCode) throw new Error('Invalid code');
    user.verified = true;
  },

  async signIn(email: string, password: string) {
    const user = Object.values(users).find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    return {
      AuthenticationResult: {
        accessToken: 'mockAccessToken',
        email: user.email,
      },
    };
  },

  async globalSignOut(accessToken: string) {
    return { success: true };
  },

  async deleteCognitoUser(token: string) {
    return;
  },

  async forgotPassword(username: string) {
    if (!Object.values(users).find((u) => u.email === username)) {
      throw new Error('User not found');
    }
    return {
      CodeDeliveryDetails: { Destination: username, DeliveryMedium: 'email' },
    };
  },

  async confirmForgotPassword({ email, confirmationCode, password }: any) {
    if (verificationCodes[email] !== confirmationCode) throw new Error('Invalid code');
    const user = Object.values(users).find((u) => u.email === email);
    if (!user) throw new Error('User not found');
    user.password = password;
    return { success: true };
  },

  async getStatusAndSubFromId(email: string) {
    const entry = Object.entries(users).find(([_id, u]) => u.email === email);
    if (!entry) throw new Error('User not found');
    const [id, user] = entry;
    return { status: user.verified ? 'VERIFIED' : 'UNVERIFIED', sub: id };
  },

  async sendVerificationEmail(email: string) {
    if (!verificationCodes[email]) verificationCodes[email] = defaultCode;
    return { sent: true };
  },

  async deleteUserData(userSk: string) {
    delete users[userSk];
    return;
  },

  async deleteCognitoUserDetails(userEmail: string) {
    return;
  },

  async disableUser(userEmail: string) {
    return;
  },

  async refundUser(pi_id: string) {
    return { refundId: 'mock-refund', pi_id, status: 'refunded' };
  },

  async updateUserSuccessfulPaymentStatus(userSk: string, pi_id: string) {
    const user = users[userSk];
    if (!user) throw new Error('User not found');
    user.has_paid = true;
    user.pi_id = pi_id;
    return { Attributes: user };
  },

  async updateUserById(userSk: string, fieldName: string, fieldValue: any) {
    const user = users[userSk];
    if (!user) throw new Error('User not found');
    (user as any)[fieldName] = fieldValue;
    return { Attributes: user };
  },
};