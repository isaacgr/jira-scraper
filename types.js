const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLBoolean,
  Kind
} = require("graphql");

const isValidDate = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) {
    return null;
  } // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) {
    return null;
  } // NaN value, Invalid date
  return dateString;
};

const DateType = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize: isValidDate,
  parseValue: isValidDate,
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return isValidDate(ast.value);
    }
    return null;
  }
});

const TimestampType = new GraphQLScalarType({
  name: "Timestamp",
  description: "Custom timestamp type for long integers",
  serialize(value) {
    return new Date(value).getTime(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  }
});

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: () => ({
    name: { type: GraphQLString },
    displayName: { type: GraphQLString }
  })
});

const CommitterType = new GraphQLObjectType({
  name: "Committer",
  fields: () => ({
    name: { type: GraphQLString },
    displayName: { type: GraphQLString },
    slug: { type: GraphQLString }
  })
});

const FieldType = new GraphQLObjectType({
  name: "Fields",
  fields: () => ({
    assignee: { type: PersonType },
    reporter: { type: PersonType },
    creator: { type: PersonType },
    created: { type: GraphQLString },
    updated: { type: GraphQLString },
    summary: { type: GraphQLString },
    description: { type: GraphQLString }
  })
});

const IssueType = new GraphQLObjectType({
  name: "Issue",
  fields: () => ({
    id: { type: GraphQLString },
    key: { type: GraphQLString },
    fields: { type: FieldType }
  })
});

const CommentType = new GraphQLObjectType({
  name: "Comments",
  fields: () => ({
    id: { type: GraphQLString },
    author: { type: PersonType },
    updateAuthor: { type: PersonType },
    created: { type: GraphQLString },
    updated: { type: GraphQLString },
    body: { type: GraphQLString }
  })
});

const IssueResultType = new GraphQLObjectType({
  name: "IssueResults",
  fields: () => ({
    total: { type: GraphQLInt },
    maxResults: { type: GraphQLInt },
    issues: { type: GraphQLList(IssueType) }
  })
});

const CommentResultType = new GraphQLObjectType({
  name: "CommentResults",
  fields: () => ({
    total: { type: GraphQLInt },
    maxResults: { type: GraphQLInt },
    comments: { type: GraphQLList(CommentType) }
  })
});

const CommitType = new GraphQLObjectType({
  name: "Commit",
  fields: () => ({
    id: { type: GraphQLString },
    displayId: { type: GraphQLString },
    authorTimestamp: { type: GraphQLString },
    url: { type: GraphQLString },
    author: { type: PersonType },
    message: { type: GraphQLString }
  })
});

const RepositoryType = new GraphQLObjectType({
  name: "Respository",
  fields: () => ({
    name: { type: GraphQLString },
    commits: { type: GraphQLList(CommitType) }
  })
});

const StashValueType = new GraphQLObjectType({
  name: "StashValue",
  fields: () => ({
    key: { type: GraphQLString },
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    slug: { type: GraphQLString }
  })
});

const StashCommitType = new GraphQLObjectType({
  name: "StashCommit",
  fields: () => ({
    id: { type: GraphQLString },
    displayId: { type: GraphQLString },
    authorTimestamp: { type: TimestampType },
    committerTimestamp: { type: TimestampType },
    author: { type: CommitterType },
    committer: { type: CommitterType },
    message: { type: GraphQLString },
    jiraKey: {
      type: GraphQLList(GraphQLString),
      resolve(parent, args) {
        return parent.properties ? parent.properties["jira-key"] : null;
      }
    }
  })
});

const StashPullRequestType = new GraphQLObjectType({
  name: "StashPullRequest",
  fields: () => ({
    id: { type: GraphQLString },
    createdDate: { type: TimestampType },
    updatedDate: { type: TimestampType },
    author: {
      type: CommitterType,
      resolve(parent, args) {
        return parent.author.user;
      }
    },
    reviewers: {
      type: GraphQLList(CommitterType),
      resolve(parent, args) {
        return parent.reviewers.map((user) => {
          return user.user;
        });
      }
    },
    title: { type: GraphQLString }
  })
});

const StashRepoPullRequestResultsType = new GraphQLObjectType({
  name: "StashRepoPullRequestResults",
  fields: () => ({
    size: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    isLastPage: { type: GraphQLBoolean },
    start: { type: GraphQLInt },
    nextPageStart: { type: GraphQLInt },
    values: { type: GraphQLList(StashPullRequestType) }
  })
});

const StashRepoCommitResultsType = new GraphQLObjectType({
  name: "StashRepoCommitResults",
  fields: () => ({
    size: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    isLastPage: { type: GraphQLBoolean },
    start: { type: GraphQLInt },
    nextPageStart: { type: GraphQLInt },
    values: { type: GraphQLList(StashCommitType) }
  })
});

const StashProjectResultsType = new GraphQLObjectType({
  name: "StashProjectResults",
  fields: () => ({
    size: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    isLastPage: { type: GraphQLBoolean },
    start: { type: GraphQLInt },
    nextPageStart: { type: GraphQLInt },
    values: { type: GraphQLList(StashValueType) }
  })
});

module.exports = {
  IssueResultType,
  RepositoryType,
  CommentResultType,
  IssueType,
  StashProjectResultsType,
  StashRepoCommitResultsType,
  StashRepoPullRequestResultsType,
  DateType
};
