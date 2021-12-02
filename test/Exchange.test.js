import { tokens, EVM_REVERT } from './helpers';
require('chai').use(require('chai-as-promised')).should();

const Exchange = artifacts.require('./Exchange');
const Token = artifacts.require('./Token');

contract('Exchange', ([deployer, feeAccount, user1]) => {
  let token;
  let exchange;
  const feePercentage = 10;
  beforeEach(async () => {
    token = await Token.new();
    exchange = await Exchange.new(feeAccount, feePercentage);
    token.transfer(user1, tokens(100), { from: deployer });
  });
  describe('deployment', () => {
    it('tracks the fee account', async () => {
      const result = await exchange.feeAccount();
      result.should.equal(feeAccount);
    });
    it('tracks the fee percentage', async () => {
      const result = await exchange.feePercent();
      result.toString().should.equal(feePercentage.toString());
    });
  });

  describe('depositing tokens', () => {
    let result;
    const amount = tokens(10);
    beforeEach(async () => {
      await token.approve(exchange.address, amount, { from: user1 });
      await exchange.depositToken(token.address, amount, { from: user1 });
    });
    describe('success', () => {
      it('tracks the token deposit', async () => {
        let balance;
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
      });
    });
    describe('failure', () => {});
  });
});
