import { Issue } from "./types";
import { getClosedIssues } from './queries';
import Handlebars from "handlebars";
import * as core from '@actions/core';

const changelogTemplate = 
`
<!-- {{earliestClosed}} through {{latestClosed}} -->

{{#each issues}}
### {{@key}}

{{#each this}}
* [{{title}}]({{url}}) {{#each labels}}{{ url }} {{/each}}
{{/each}}

{{/each}}`;

async function generate() {    
    // Process inputs
    const authToken = core.getInput("token") || process.env.GH_TOKEN;

    console.log(`Auth token: ${authToken}`);

    console.log(`project: ${core.getInput("projects")}`);
    const projectIdentifiers = core.getInput("projects").split(",").filter(p => p.trim());
    if (projectIdentifiers.length === 0) {
        throw new Error("Invalid project identifiers.");
    }
    
    const daysToIncludes = parseInt(core.getInput("days"));
    const closedAfter = new Date();
    closedAfter.setDate(closedAfter.getDate() - daysToIncludes);

    console.log(`Closed after: ${closedAfter}`);
        
    const excludeLabels = core.getInput("exclude-labels").split(",").filter(l => l.trim());
    const highlightLabels = core.getInput("highlight-labels").split(",").filter(l => l.trim());

    // Query for closed issues
    const issues = await getClosedIssues(authToken, projectIdentifiers, closedAfter, excludeLabels);

    // Cleanup the issues for presentation (not great, but whatever)
    issues.forEach(issue => {
        issue.title = issue.title.replace(/^\[[\w ]+\]/, '').trim();
        issue.milestone.title = issue.milestone.title?.replace(/^PRX M[\d]+: /, '') || "Other";
        issue.labels = issue.labels.filter(label => highlightLabels.includes(label.name) );
    });

    // Group issues by Milestone
    const issuesByMilestone: { [key: string]: Issue[] } = issues.reduce((results, issue) => {
        const key = issue.milestone.title;
        (results[key] = results[key] || []).push(issue);
        return results;
    }, {});

    const template = Handlebars.compile(changelogTemplate);

    // Find earliest and latest close dates in the result set (just for validation purposes)
    const earliestClosed = issues.reduce((prev, issue) => { 
        return issue.closedAt < prev ? issue.closedAt : prev;
    }, new Date());

    const latestClosed = issues.reduce((prev, issue) => { 
        return issue.closedAt > prev ? issue.closedAt : prev;
    }, closedAfter);

    const output = template({ issues: issuesByMilestone, earliestClosed, latestClosed } );

    console.log(output);

    core.summary.addRaw(output);
    core.summary.write();
    
    core.setOutput("changelog", output);
}

generate();

