import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers';
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

  describe('fallback', () => {
    it('reverts when Ether is sent', async () => {
      await exchange
        .sendTransaction({ value: 1, from: user1 })
        .should.be.rejectedWith(EVM_REVERT);
    });
  });
  describe('depositing Ether', () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = ether(1);
      result = await exchange.depositEther({ from: user1, value: amount });
    });

    it('tracks the Ether deposit', async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      balance.toString().should.equal(amount.toString());
    });

    it('emits a deposit event', async () => {
      const [log] = result.logs;
      log.event.should.eq('Deposit');
      const event = log.args;
      event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct');
      event.user.toString().should.equal(user1, 'user is correct');
      event.amount
        .toString()
        .should.equal(amount.toString(), 'amount is correct');
      event.balance
        .toString()
        .should.equal(amount.toString(), 'balance is correct');
    });
    describe('success', () => {});
    describe('failure', () => {});
  });

  describe('depositing tokens', () => {
    let result;
    const amount = tokens(10);
    describe('success', () => {
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });
      it('tracks the token deposit', async () => {
        let balance;
        balance = await token.balanceOf(exchange.address);
        balance.toString().should.equal(amount.toString());
        balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal(amount.toString());
      });

      it('emits a deposit event', async () => {
        const [log] = result.logs;
        log.event.should.eq('Deposit');
        const event = log.args;
        event.token.toString().should.equal(token.address, 'token is correct');
        event.user.toString().should.equal(user1, 'user is correct');
        event.amount
          .toString()
          .should.equal(amount.toString(), 'amount is correct');
        event.balance
          .toString()
          .should.equal(amount.toString(), 'balance is correct');
      });
    });
    describe('failure', () => {
      it('rejects Ether deposits', async () => {
        await exchange
          .depositToken(ETHER_ADDRESS, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
      it('fails when no tokens are approved', async () => {
        await exchange
          .depositToken(token.address, tokens(10), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });
});
