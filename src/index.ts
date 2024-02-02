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

const cleanTitle = (title: string) => {
    const newTitle = title.replace(/^\[[\w ]+\]/, '').trim();
    return newTitle !== title ? cleanTitle(newTitle) : newTitle;
}

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
        
    const excludeLabels = core.getInput("exclude_labels").split(",").filter(l => l.trim());
    const highlightLabels = core.getInput("highlight_labels").split(",").filter(l => l.trim());

    console.log(highlightLabels);

    // Query for closed issues
    let issues = await getClosedIssues(authToken, projectIdentifiers, closedAfter, excludeLabels);

    // Cleanup the issues for presentation (not great, but whatever)
    issues.forEach(issue => {
        issue.title = cleanTitle(issue.title);
        issue.milestone.title = issue.milestone.title?.replace(/^PRX M[\d]+: /, '') || "Other";
        issue.labels = issue.labels.filter(label => highlightLabels.includes(label.name) );
    });

    issues = issues.sort((a, b) => a.number - b.number);

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

    if (process.env.GITHUB_STEP_SUMMARY) {
        core.summary.addRaw(output);
        core.summary.write();
    }
    
    core.setOutput("changelog", output);
}

generate();

