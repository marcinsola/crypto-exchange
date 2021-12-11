import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers';
require('chai').use(require('chai-as-promised')).should();

const Exchange = artifacts.require('./Exchange');
const Token = artifacts.require('./Token');

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
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

  describe('withdrawing Ether', () => {
    const amount = ether(1);
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount });
    });

    describe('success', () => {
      let result;
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, { from: user1 });
      });

      it('withdrawsEtherFunds', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        balance.toString().should.equal('0');
      });

      it('emits a Withdrawal event', async () => {
        const [log] = result.logs;
        log.event.should.eq('Withdrawal');
        const event = log.args;
        event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct');
        event.user.toString().should.equal(user1, 'user is correct');
        event.amount
          .toString()
          .should.equal(amount.toString(), 'amount is correct');
        event.balance.toString().should.equal('0', 'balance is correct');
      });
    });
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

  describe('withdrawing tokens', () => {
    const amount = tokens(10);

    describe('success', () => {
      let result;
      beforeEach(async () => {
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, { from: user1 });
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it('withdrawsTokenFunds', async () => {
        const balance = await exchange.tokens(token.address, user1);
        balance.toString().should.equal('0');
      });

      it('emits a Withdrawal event', async () => {
        const [log] = result.logs;
        log.event.should.eq('Withdrawal');
        const event = log.args;
        event.token.toString().should.equal(token.address, 'token is correct');
        event.user.toString().should.equal(user1, 'user is correct');
        event.amount
          .toString()
          .should.equal(amount.toString(), 'amount is correct');
        event.balance.toString().should.equal('0', 'balance is correct');
      });
    });

    describe('failure', () => {
      it('rejects Ether withdraws', async () => {
        await exchange
          .withdrawToken(ETHER_ADDRESS, amount, { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });

      it('fails with insufficient funds', async () => {
        await exchange
          .withdrawToken(token.address, tokens(15), { from: user1 })
          .should.be.rejectedWith(EVM_REVERT);
      });
    });
  });

  describe('making orders', () => {
    let result;
    const amount = tokens(1);
    beforeEach(async () => {
      result = await exchange.makeOrder(
        token.address,
        amount,
        ETHER_ADDRESS,
        amount,
        { from: user1 }
      );
    });

    it('tracks the newly created order', async () => {
      const orderCount = await exchange.orderCount();
      orderCount.toString().should.equal('1');
      const order = await exchange.orders(orderCount);
      order.id.toString().should.equal(orderCount.toString(), 'id is correct');
      order.user.toString().should.equal(user1, 'user is correct');
      order.tokenGet
        .toString()
        .should.equal(token.address, 'tokenGet is correct');
      order.amountGet
        .toString()
        .should.equal(amount.toString(), 'amoungGet is correct');
      order.tokenGive
        .toString()
        .should.equal(ETHER_ADDRESS, 'tokenGive is correct');
      order.amountGive
        .toString()
        .should.equal(amount.toString(), 'amountGive is correct');
      order.timestamp
        .toString()
        .length.should.be.at.least(1, 'timestamp is present');
    });

    it('emits the Order event', async () => {
      const orderCount = await exchange.orderCount();
      const [log] = result.logs;
      log.event.should.eq('Order');
      const event = log.args;
      event.id.toString().should.equal(orderCount.toString(), 'id is correct');
      event.user.toString().should.equal(user1, 'user is correct');
      event.tokenGet
        .toString()
        .should.equal(token.address, 'tokenGet is correct');
      event.amountGet
        .toString()
        .should.equal(amount.toString(), 'amoungGet is correct');
      event.tokenGive
        .toString()
        .should.equal(ETHER_ADDRESS, 'tokenGive is correct');
      event.amountGive
        .toString()
        .should.equal(amount.toString(), 'amountGive is correct');
      event.timestamp
        .toString()
        .length.should.be.at.least(1, 'timestamp is present');
    });
  });

  describe('order actions', () => {
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: ether(1) });
      await token.transfer(user2, tokens(100), { from: deployer });

      await token.approve(exchange.address, tokens(2), { from: user2 });
      await exchange.depositToken(token.address, tokens(2), { from: user2 });

      await exchange.makeOrder(
        token.address,
        tokens(1),
        ETHER_ADDRESS,
        ether(1),
        {
          from: user1,
        }
      );
    });

    describe('filling orders', () => {
      let result;

      describe('success', () => {
        beforeEach(async () => {
          result = await exchange.fillOrder('1', { from: user2 });
        });

        it('executes the trade & charge fees', async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1);
          balance
            .toString()
            .should.equal(tokens(1).toString(), 'user1 received tokens');

          balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
          balance
            .toString()
            .should.equal(ether(1).toString(), 'user2 received Ether');

          balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
          balance.toString().should.equal('0', 'user1 Ether deducted');

          balance = await exchange.balanceOf(token.address, user2);
          balance
            .toString()
            .should.equal(
              tokens(0.9).toString(),
              'user2 tokens deducted with fee applied'
            );

          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          balance
            .toString()
            .should.equal(tokens(0.1).toString(), 'feeAccount received fee');
        });
      });

      describe('failure', () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 9999;
          await exchange
            .fillOrder(invalidOrderId, { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it('rejects already filled orders', async () => {
          await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled;
          await exchange
            .fillOrder('1', { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it('rejects cancelled orders', async () => {
          await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled;
          await exchange
            .cancelOrder('1', { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });

    describe('cancelling orders', () => {
      let result;

      describe('success', () => {
        beforeEach(async () => {
          await exchange.cancelOrder('1', { from: user1 });
        });

        it('updates cancelled orders', async () => {
          const orderCancelled = await exchange.orderCancelled(1);
          orderCancelled.should.equal(true);
        });
      });

      describe('failure', () => {
        it('rejects invalid order ids', async () => {
          const invalidOrderId = 99999;
          await exchange
            .cancelOrder(invalidOrderId, { from: user1 })
            .should.be.rejectedWith(EVM_REVERT);
        });

        it('rejects invalid cancellations', async () => {
          await exchange
            .cancelOrder('1', { from: user2 })
            .should.be.rejectedWith(EVM_REVERT);
        });
      });
    });
  });

  describe('checking balances', () => {
    const amount = ether(1);
    beforeEach(async () => {
      await exchange.depositEther({ from: user1, value: amount });
    });

    it('returns user balance', async () => {
      const result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      result.toString().should.equal(amount.toString());
    });
  });
});
