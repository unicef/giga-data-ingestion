# Approval Requests

## How to run full flow

1. Ensure that you have a countries' valid `cdc` file located in the **pending approval request location**
2. Click on `Approve Rows`
3. Select cells to approve or reject.
4. `Approve` or `Reject` selected rows once a pop up appears. Proceed to next step as necessary
5. Review your selected rows and the approve your request
6. Assert that the `approved/rejected jsons` apear in their respective result destinations

## Faq

- There should only be one `cdc` file for a country at any time.
- The approval pipeline gets the latest file via the timestamp of the `json` and then archives all the other `rejected/approved` `jsons`

### Important locations

- Approved results json destination: `staging/{dataset}/approved-rows`
- Rejected results json destination: `staging/{dataset}/rejected-rows`
- Pending approval requests: `raw/approval_requests/{dataset}`
