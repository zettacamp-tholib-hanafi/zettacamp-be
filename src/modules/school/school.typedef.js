// *************** IMPORT LIBRARY ***************
const gql = require("graphql-tag");

module.exports = gql`
scalar Date
enum SchoolStatus {
  PENDING
  ACTIVE
  DELETED
}

type VerifiedInfo {
  status_verified: Boolean!
  verified_by: String
  verified_at: Date
}

type Address {
  street_name: String!
  street_number: String!
  city: String!
  state: String!
  postal_code: String!
  country: String!
  address_line1: String!
  address_line2: String
}

type Contact {
  phone: String
  email: String
  website: String
}

type AdminUser {
  id: String
  role: String
  assigned_at: String
}

type School {
  id: ID!
  short_name: String!
  long_name: String!
  logo_url: String
  verified: [VerifiedInfo!]!
  address: Address!
  contact: Contact
  admin_user: [AdminUser]
  school_status: SchoolStatus!
  deleted_at: Date
  deleted_by: String
  created_at: Date!
  created_by: String!
  updated_at: Date
  updated_by: String!
  students: [Student]
}

input VerifiedInfoInput {
  status_verified: Boolean!
  verified_by: String
  verified_at: Date
}

input AddressInput {
  street_name: String!
  street_number: String!
  city: String!
  state: String!
  postal_code: String!
  country: String!
  address_line1: String!
  address_line2: String
}

input ContactInput {
  phone: String
  email: String
  website: String
}

input AdminUserInput {
  id: String
  role: String
  assigned_at: String
}

input CreateSchoolInput {
  short_name: String!
  long_name: String!
  logo_url: String
  verified: [VerifiedInfoInput!]!
  address: AddressInput!
  contact: ContactInput
  admin_user: [AdminUserInput]
  school_status: SchoolStatus!
  deleted_at: Date
  deleted_by: String
  created_at: Date!
  created_by: String!
  updated_at: Date
  updated_by: String!
}

input UpdateSchoolInput {
  short_name: String
  long_name: String
  logo_url: String
  verified: [VerifiedInfoInput!]
  address: AddressInput
  contact: ContactInput
  admin_user: [AdminUserInput]
  school_status: SchoolStatus
  deleted_at: Date
  deleted_by: String
  created_at: Date
  created_by: String
  updated_at: Date
  updated_by: String
}

input SchoolFilterInput {
  school_status: SchoolStatus
}

extend type Query {
  GetAllSchools(filter: SchoolFilterInput): [School!]!
  GetOneSchool(id: ID!, filter: SchoolFilterInput): School
}

extend type Mutation {
  CreateSchool(input: CreateSchoolInput!): School!
  UpdateSchool(id: ID!, input: UpdateSchoolInput!): School!
  DeleteSchool(id: ID!): School!
}
`;
