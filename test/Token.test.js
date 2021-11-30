import { tokens } from './helpers';
require('chai').use(require('chai-as-promised')).should();

const Token = artifacts.require('./Token');

contract('Token', ([deployer, receiver]) => {
  const name = 'Solski Token';
  const symbol = 'SLK';
  const decimals = '18';
  const totalSupply = tokens(1000000);
  let token;
  beforeEach(async () => {
    token = await Token.new();
  });
  describe('deployment', () => {
    it('Tracks the name', async () => {
      const result = await token.name();
      result.should.equal(name);
    });

    it('Tracks the symbol', async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });

    it('Tracks the decimals', async () => {
      const result = await token.decimals();
      result.toString().should.equal(decimals);
    });

    it('Tracks the total supply', async () => {
      const result = await token.totalSupply();
      result.toString().should.equal(totalSupply.toString());
    });

    it('Assigns the total supply to the deployer', async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply.toString());
    });
  });

  describe('sending tokens', () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = tokens(100);
      result = await token.transfer(receiver, amount, { from: deployer });
    });

    it('transfers token balances', async () => {
      let balanceOf;

      balanceOf = await token.balanceOf(deployer);
      balanceOf.toString().should.equal(tokens(999900).toString());

      balanceOf = await token.balanceOf(receiver);
      balanceOf.toString().should.equal(tokens(100).toString());
    });
  });
});
