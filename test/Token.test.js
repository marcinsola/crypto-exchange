require('chai').use(require('chai-as-promised')).should();
const Token = artifacts.require('./Token');

contract('Token', ([deployer]) => {
  const name = 'Solski Token';
  const symbol = 'SLK';
  const decimals = '18';
  const totalSupply = '1000000000000000000000000';
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
      result.toString().should.equal(totalSupply);
    });

    it('Assigns the total supply to the deployer', async () => {
      const result = await token.balanceOf(deployer);
      result.toString().should.equal(totalSupply);
    });
  });
});