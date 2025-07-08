// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  enum UserStatus {
    ACTIVE
    PENDING
    DELETED
  }

  enum UserRoles {
    ACADEMIC_DIRECTOR
    ACADEMIC_ADMIN
    CORRECTOR
    STUDENT
  }

  type UserPreferences {
    language: String
    timezone: String
  }

  type User {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    role: [UserRoles!]!
    user_status: UserStatus!
    phone: String
    profile_picture_url: String
    department: String
    permissions: [String!]
    preferences: UserPreferences
    created_at: Date
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  type AuthLogin {
    token: String!
    user: User!
  }

  input UserPreferencesInput {
    language: String
    timezone: String
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    password: String!
    role: [UserRoles!]!
    user_status: UserStatus!
    phone: String
    profile_picture_url: String
    department: String
    permissions: [String!]
    preferences: UserPreferencesInput
    created_by: String
  }

  input UpdateUserInput {
    first_name: String
    last_name: String
    email: String
    password: String
    role: [UserRoles!]
    user_status: UserStatus
    phone: String
    profile_picture_url: String
    department: String
    permissions: [String!]
    preferences: UserPreferencesInput
    updated_by: String
  }

  input UserFilterInput {
    user_status: UserStatus
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    GetAllUsers(filter: UserFilterInput): [User!]!
    GetOneUser(id: ID!, filter: UserFilterInput): User
  }

  type Mutation {
    CreateUser(input: CreateUserInput!): User!
    UpdateUser(id: ID!, input: UpdateUserInput!): User!
    DeleteUser(id: ID!): User!
    AuthLogin(input: LoginInput!): AuthLogin!
  }
`;
