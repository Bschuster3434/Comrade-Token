# Comrade Token and The Token Economics of Automatic Taxes
Open Source Repository for a Fee Paying Cryptocurrency that conforms to the ERC20 standard.

## Motivations
Currently in the cryptocurrency community, there is no easy way to automatically send tokens a governance board without direct contributions or payment for services. For some tokens, this might be preferrable as the organization is more like a business. However, for some community run organizations that don't sell a service per se (instead creating a culture), there might be a reason to add a fee to individuals for using the currency. Instead of making a deliberate 'payment' to the organization, the tax or redistribution will be built into the token.

This is an experiment in trying to make that work. This token will operate by redistributing payments of a standard ERC-20 token to a community managed fund, which can then be distributed as the community sees fit. It's most easiest to think of the token as a 'tax' on the transaction, distributing tokens to this community managed fund. How that fund is managed is outside the scope of the original token and can be handled through subsequent contracts or mechanism.

Comrade Coin will initiatially redistribute tokens automatically to a community faucet that can then be used by anyone who has less than a certain # of tokens, but this can be changed to some other fund or address as the community or token holders sees fit.

## Core functionality

There are several unique elements to the way that this token mechanism operates:

- The token, upon every transaction, will calculate automatically how much tax the sender owes in addition to their sent amount of tokens at their transactional tax rate. If there is not enough tokens to pay for the transaction, it will fail and the user will have to reduce their sent.
- The mechanism of how much sender owes is up to the token creator, and can be progressive, flat, or regressive based on the goals of the community.
- The funds can be send to any address that the community wishes. This will be controlled by the owner of the contract.
- Some community accounts can be considered excempt from the community tax, as these are community assets that ultimately benefit from the token. These can include community funds, faucets or any other accounts or smart contracts that are exempt from paying taxes.
- Tokens that are sent from other non-contract accounts pay a fee post transaction (total spent = amount + fee). Tokens that are sent by a contract are pay a fee pre transaction (total spent = fee + (amount - fee)). 

## COMRADE Token Statistics

- Address: 0xfefEA1c5CD7e6db8639F5358A28F605A501367F3 (Polygon Mumbai)
- Name: Comrade Token v2
- Symbol: COMRADE2
- Supply: 1000000000 Tokens
- Decimals: 18 Units
- Tax Style: Flat
- Tax per transaction: 1%