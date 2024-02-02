"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const handlebars_1 = __importDefault(require("handlebars"));
const core = __importStar(require("@actions/core"));
const labelsToShow = ["bug"];
const changelogTemplate = `
<!-- {{earliestClosed}} through {{latestClosed}} -->

{{#each issues}}
### {{@key}}

{{#each this}}
* [{{title}}]({{url}}) {{#each labels}}{{ url }} {{/each}}
{{/each}}

{{/each}}`;
function generate() {
    return __awaiter(this, void 0, void 0, function* () {
        // Process inputs
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
        // Query for closed issues
        const issues = yield (0, queries_1.getClosedIssues)(projectIdentifiers, closedAfter, excludeLabels);
        // Cleanup the issues for presentation (not great, but whatever)
        issues.forEach(issue => {
            var _a;
            issue.title = issue.title.replace(/^\[[\w ]+\]/, '').trim();
            issue.milestone.title = ((_a = issue.milestone.title) === null || _a === void 0 ? void 0 : _a.replace(/^PRX M[\d]+: /, '')) || "Other";
            issue.labels = issue.labels.filter(label => labelsToShow.includes(label.name));
        });
        // Group issues by Milestone
        const issuesByMilestone = issues.reduce((results, issue) => {
            const key = issue.milestone.title;
            (results[key] = results[key] || []).push(issue);
            return results;
        }, {});
        const template = handlebars_1.default.compile(changelogTemplate);
        // Find earliest and latest close dates in the result set (just for validation purposes)
        const earliestClosed = issues.reduce((prev, issue) => {
            return issue.closedAt < prev ? issue.closedAt : prev;
        }, new Date());
        const latestClosed = issues.reduce((prev, issue) => {
            return issue.closedAt > prev ? issue.closedAt : prev;
        }, closedAfter);
        const output = template({ issues: issuesByMilestone, earliestClosed, latestClosed });
        console.log(output);
        core.summary.addRaw(output);
        core.setOutput("changelog", output);
    });
}
generate();
//# sourceMappingURL=index.js.map