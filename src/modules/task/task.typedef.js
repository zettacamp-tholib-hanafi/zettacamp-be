// *************** IMPORT LIBRARY ***************

const gql = require("graphql-tag");

// *************** EXPORT MODULE ***************

module.exports = gql`
  enum TaskType {
    ASSIGN_CORRECTOR
    ENTER_MARKS
    VALIDATE_MARKS
  }

  enum TaskStatus {
    PENDING
    PROGRESS
    COMPLETED
    DELETED
  }

  type Task {
    id: ID!
    test_id: ID!
    test: Test
    user_id: ID!
    user: User
    task_type: TaskType!
    task_status: TaskStatus!
    due_date: Date
    created_at: Date
    created_by: String
    updated_at: Date
    updated_by: String
    deleted_at: Date
    deleted_by: String
  }

  input CreateTaskInput {
    test_id: ID!
    user_id: ID!
    task_type: TaskType!
    task_status: TaskStatus!
    due_date: Date
    created_by: String
  }

  input UpdateTaskInput {
    test_id: ID!
    user_id: ID!
    task_type: TaskType!
    task_status: TaskStatus!
    due_date: Date
    updated_by: String
  }

  input TaskFilter {
    test_id: ID
    user_id: ID
    task_type: TaskType
    task_status: TaskStatus
  }
  input AssignCorrectorInput {
    user_id: ID!
    due_date: Date
  }

  type Query {
    GetAllTasks(filter: TaskFilter): [Task!]!
    GetOneTask(id: ID!, filter: TaskFilter): Task
  }

  type Mutation {
    CreateTask(input: CreateTaskInput!): Task!
    UpdateTask(id: ID!, input: UpdateTaskInput!): Task!
    DeleteTask(id: ID!, deleted_by: String): Task!
    AssignCorrector(id: ID!, input: AssignCorrectorInput!): Task!
  }
`;
