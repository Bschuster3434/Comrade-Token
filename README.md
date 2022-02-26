# Comrade Token and The Token Economics of Automatic Taxes
Open Source Repository for the Automatically Redistributing EVM-Compatible Comrade Token

## Motivations
Currently in the cryptocurrency community, there is no easy way to automatically send tokens a governance board without direct contributions or payment for services. For some tokens, this might be preferrable as the organization is more like a business. However, for some community run organizations that don't sell a service per se (instead creating a culture), there might be a reason to add a fee to individuals for using the currency. Instead of making a deliberate 'payment' to the organization, the tax or redistribution will be built into the token.

This is an experiment in trying to make that work. This token will operate by redistributing payments of a standard ERC-20 token to a community managed fund, which can then be distributed as the community sees fit. It's most easiest to think of the token as a 'tax' on the user, distributing tokens to this community managed fund. How that fund is managed is outside the scope of the original token and can be handled through subsequent contracts or mechanism.

Comrade Coin will initiatially redistribute tokens automatically to a community faucet that can then be used by anyone who has less than a certain # of tokens, but this can be changed to some other fund or address as the community or token holders sees fit.

## Core functionality

There are several unique elements to the way that this token mechanism operates:

- The token, upon every transaction, will calculate automatically how much tax the sender owes in addition to their sent amount of tokens at their transactional tax rate. If there is not enough tokens to pay for the transaction, it will fail and the user will have to reduce their sent.
- The mechanism of how much sender owes is up to the token creator, and can be progressive, flat, or regressive based on the goals of the community.
- The funds can be send to any address that the community wishes. This will be controlled by the owner of the contract.
- Some community accounts can be considered excempt from the community tax, as these are community assets that ultimately benefit from the token. These can include community funds, faucets or any other accounts or smart contracts that are exempt from paying taxes.
- The token owner role cannot be renounced, but it is transferrable.

## Comrade Token Specifics

- Token Name: Comrade Token
- Token Symbol: COMRADE
- Total Supply: 1,000,000,000 Tokens
- Decimals: 18
- Mintable: No
- Ownable: Yes
- Tax Style: Progressive
- Tax Rates: 0 - 1000 COMRADE: 0%, 1000+ COMRADE 3%

## Tokenomics By Example

- Alice has 0 COMRADE
- Bob has 1,000 COMRADE
- David has 10,000 COMRADE
- Walter has 1,000,000 COMRADE
- Community is an Address controlled by the Community DAO and starts at 0

### Scenario 1

Bob sends Alice 500 COMRADE. 
The transaction will send 500 COMRADE to Alice.
No Fees are paid to Community.
Final Balances: Alice 500, Bob 500, Community 0

### Scenario 2

David send Alice 500 COMRADE
The transaction will send 500 COMRADE to Alice.
David will pay a progress transaction tax as he has more than 1,000 COMRADE. His rate is:

`(1,000 COMRADE / 10,000 COMRADE) * 0 % + (9,000 COMRADE / 10,000 COMRADE) * 3% = 2.7%`,

Resulting in a fee to Community:

`2.7% * 500 COMRADE = 13.5 COMRADE`

Final Balances: Alice 500, David 9,486.5 , Community 13.5

### Scenario 3

Walter sends David 500,000 COMRADE
The transactino will send 500,000 COMRADE to David
Walter will pay a progress transaction tax as he has more than 1,000 COMRADE. His rate is:

`(1,000 COMRADE / 1,000,000 COMRADE) * 0 % + (999,000 COMRADE / 1,000,000 COMRADE) * 3% = 2.997%`,

Resulting in a fee to Community:

`2.997% * 500,000 COMRADE = 14,985 COMRADE`

Final Balances: David 510,000 COMRADE, Walter 485,015 COMRADE, Community 14,985 COMRADE

### Scenario 4

David sends 10,000 COMRADE to Alice
The transaction fails, as DAVID does not have any COMRADE to pay the community fee.



