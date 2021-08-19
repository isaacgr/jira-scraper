const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType
} = require("graphql");

const {
  IssueResultType,
  RepositoryType,
  CommentResultType,
  IssueType,
  StashProjectResultsType,
  StashRepoCommitResultsType,
  StashRepoPullRequestResultsType,
  DateType
} = require("./types");

const moment = require("moment");
const axios = require("axios");
const jiraUrl = `${process.env.JIRA_URL}`;
const stashUrl = `${process.env.STASH_URL}`;

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    projectIssues: {
      name: "JiraIssues",
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
    issue: {
      name: "Issue",
      type: IssueType,
      args: {
        issueIdOrKey: { type: GraphQLString }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${jiraUrl}/rest/api/latest/issue/${issueIdOrKey}`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
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
    },
    issueCommits: {
      name: "IssueCommits",
      type: new GraphQLList(RepositoryType),
      args: {
        issueId: { type: GraphQLString }
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
    userIssues: {
      name: "UserIssues",
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
    stashProjects: {
      name: "StashProjects",
      type: StashProjectResultsType,
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${stashUrl}/projects`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
      }
    },
    stashProjectRepositories: {
      name: "StashProjectRepos",
      type: StashProjectResultsType,
      args: {
        projectKey: { type: GraphQLString }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${stashUrl}/projects/${args.projectKey}/repos`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
      }
    },
    stashRepoCommits: {
      name: "StashRepoCommits",
      type: StashRepoCommitResultsType,
      args: {
        projectKey: { type: GraphQLString },
        repoSlug: { type: GraphQLString }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${stashUrl}/projects/${args.projectKey}/repos/${args.repoSlug}/commits?state=all&order=newest`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
      }
    },
    stashRepoPullRequests: {
      name: "StashRepoPullRequests",
      type: StashRepoPullRequestResultsType,
      args: {
        projectKey: { type: GraphQLString },
        repoSlug: { type: GraphQLString }
      },
      resolve(parent, args) {
        return axios({
          method: "get",
          url: `${stashUrl}/projects/${args.projectKey}/repos/${args.repoSlug}/pull-requests?state=all&order=newest`,
          headers: {
            Authorization:
              "Basic " +
              base64encode(`${process.env.JIRA_USER}:${process.env.JIRA_PASS}`)
          }
        }).then((res) => res.data);
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
