const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType
} = require("graphql");

const moment = require("moment");
const axios = require("axios");
const jiraUrl = `${process.env.JIRA_URL}`;

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

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: () => ({
    name: { type: GraphQLString },
    displayName: { type: GraphQLString }
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
  name: "Issues",
  fields: () => ({
    id: { type: GraphQLString },
    key: { type: GraphQLString },
    fields: { type: FieldType }
  })
});

const IssueResultType = new GraphQLObjectType({
  name: "IssueResults",
  fields: () => ({
    total: { type: GraphQLInt },
    issues: { type: GraphQLList(IssueType) }
  })
});

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

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    projectIssues: {
      type: IssueResultType,
      args: {
        projectId: { type: GraphQLString },
        startAt: { type: GraphQLInt, defaultValue: 0 },
        maxResults: { type: GraphQLInt, defaultValue: 100 }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${jiraUrl}/search?jql=project=${args.projectId}&startAt=${args.startAt}&maxResults=${args.maxResults}`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
      }
    },
    userIssues: {
      type: IssueResultType,
      args: {
        project: { type: GraphQLString },
        username: { type: GraphQLString },
        startAt: { type: GraphQLInt, defaultValue: 0 },
        maxResults: { type: GraphQLInt, defaultValue: 100 },
        start: {
          type: DateType,
          defaultValue: moment()
            .month("May")
            .date("1")
            .subtract(1, "year")
            .format("YYYY-MM-DD")
        },
        end: {
          type: DateType,
          defaultValue: moment().month("April").date("30").format("YYYY-MM-DD")
        }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${jiraUrl}/search?jql=
          ((created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND summary ~ ${args.username} OR 
          (created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND description ~ ${args.username} OR 
          (created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND comment ~ ${args.username} OR 
          (created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND creator = ${args.username} OR
          (created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND project = ${args.project} AND assignee = ${args.username} OR
          (created >= ${args.start} AND created <= ${args.end} OR updated >= ${args.start} AND updated <= ${args.end}) AND project = ${args.project} AND project = ${args.project} AND reporter = ${args.username}) ORDER BY updated
          &startAt=${args.startAt}&maxResults=${args.maxResults}`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
      }
    },
    issueCommits: {
      name: "IssueCommits",
      type: new GraphQLList(RepositoryType),
      args: {
        issueId: { type: GraphQLString },
        issueKey: { type: GraphQLString, defaultValue: null }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${jiraUrl}/rest/dev-status/1.0/issue/detail?issueId=${args.issueId}&applicationType=stash&dataType=repository`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data.detail.repositories);
      }
    },
    issueComments: {
      name: "IssueComments",
      type: CommentResultType,
      args: {
        issueIdOrKey: { type: GraphQLString }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${jiraUrl}/rest/api/latest/issue/${issueIdOrKey}/comment`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data.detail.repositories);
      }
    }
  }
});

const base64encode = (data) => {
  let buff = new Buffer.from(data);
  return buff.toString("base64");
};

module.exports = new GraphQLSchema({
  query: RootQuery
});
