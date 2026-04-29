---
name: Sandbox performance & token errors
description: Diagnosing sandbox scenario failure plus response time and caching follow-up.
type: general
stage: general
date: 2026-04-29
surface: agent
model: gpt-4o-mini
feature: none
branch: main
user: user
labels: ["fbr","sandbox","performance","cache"]
command: analyze sandbox failure
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - src/lib/fbr/context.ts
  - src/app/api/sandbox/check-connection/route.ts
  - src/app/api/sandbox/run-scenario/route.ts
tests_yaml:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
prompt_text: |
# Context from my IDE setup:

## Active file: src/lib/fbr/context.ts

## Open tabs:
- context.ts: src/lib/fbr/context.ts
- route.ts: src/app/api/sandbox/run-scenario/route.ts
- route.ts: src/app/api/sandbox/check-connection/route.ts
- payload.json: payload.json

## My request for Codex:
check the why this error while running the sceneios and check the response time of app should be and use cahce like one the data fetches from data base it should be re fetch when reload the page these are the errors Pre-flight Checks
Run Checks
API_CONN
Test basic connectivity to FBR sandbox API
✓ Pass
0.78s
Successfully connected to FBR sandbox API
https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb
TOKEN_VALID
Verify sandbox API token is valid and has required permissions
✗ Fail
0.78s
FBR rejected request: token is not authorized for this NTN
https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb
🧪 SANDBOX MODE
✓ 0 passed
✗ 1 failed
(1/28 run)
▶ Run All Scenarios
SN001
✗ Fail
▶ Run
Standard Rate - Registered Buyer
Tax: 18%
Type: Goods at standard rate (default)
buyerNTNCNIC
hsCode
rate
Most common scenario. Buyer is registered for sales tax.
⏱ 5.15s
Error: FBR: Unauthorized access: Provided seller registration number is not 13 digits (CNIC) or 7 digits (NTN) or the authorized token does not exist against seller registration number
▲ Hide result
{
  "error": "FBR: Unauthorized access: Provided seller registration number is not 13 digits (CNIC) or 7 digits (NTN) or the authorized token does not exist against seller registration number"
}
this is the .net sample code "using System.Net.Http;

using Newtonsoft.Json;

 

HttpClient client = new HttpClient();

client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "your token");

StringContent content = new StringContent(JsonConvert.SerializeObject(objinvoice), Encoding.UTF8, "application/json");

 

HttpResponseMessage response = client.PostAsync("https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb", content).Result;

 

if (response.IsSuccessStatusCode)

{
   Console.WriteLine("Response from API:");
    Console.WriteLine("-------------------------------");
    Console.WriteLine(response.Content.ReadAsStringAsync().Result);
}"
response_text: |
Explained that the SANDBOX scenario fails because FBR is rejecting the stored token/NTN combination (token wasn't provisioned against this seller), described how to validate/update the user token and NTN, noted the ~5s response is dominated by the remote FBR call, and suggested instrumenting timing/logging + caching business profile data to re-use between renders.
---
## Prompt
<copied above prompt_text>
## Response
Explained root cause, performance observation, and cache recommendation so the sandbox flow and page reloads stay responsive.
