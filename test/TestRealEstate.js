// Truffle
// testing framework used -> Mocha
// assertion used -> Chai

// reading file
var RealEstate = artifacts.require("./RealEstate.sol");

// contract testing 할 때 받을 Contract name = RealEstate.sol
// account(계정) 인자로 받음.
contract('RealEstate', function(accounts) {
    // 전역 변수
    var realEstateInstance;

    it("컨트랙트의 소유자 초기화 테스팅 ...", function() {
        return RealEstate.deployed().then(function(instance) {
            realEstateInstance = instance;
            return realEstateInstance.owner.call();
        }).then(function(owner) {
            // 값이 맞는지 확인 => 1. 리턴 값 2. 예상 값 3. 오류
            // 대문자화 시키는 이유 => 주소를 통일하기 위함
            assert.equal(owner.toUpperCase(), accounts[0].toUpperCase(), "owner가 Ganache의 첫번째 계정과 일치하지 않습니다.");
        });
    });

    it("Ganache의 두번째 계정으로 매물ID 0번 매입 후 이벤트 생성 및 매입자 정보와 buyers 배열 테스팅 ...", function() {
        return RealEstate.deployed().then(function(instance) {
            realEstateInstance = instance;
            return realEstateInstance.buyRealEstate(0, "gihong", 20, {from: accounts[1], value: web3.toWei(1.50, "ether")});
        }).then(function(receipt) {
            // 이벤트 테스팅
            assert.equal(receipt.logs.length, 1, "이벤트 하나가 생성되지 않았습니다.");
            assert.equal(receipt.logs[0].event, "LogBuyRealEstate", "이벤트가 LogBuyRealEstate가 아닙니다.");
            assert.equal(receipt.logs[0].args._buyer, accounts[1], "매입자가 Ganache의 두번째 계정과 일치하지 않습니다.");
            assert.equal(receipt.logs[0].args._id, 0, "매물 아이디가 0과 일치하지 않습니다.");
            return realEstateInstance.getBuyerInfo(0);
        }).then(function(buyerInfo) {
            assert.equal(buyerInfo[0].toUpperCase(), accounts[1].toUpperCase(), "매입자의 계정이 Ganache의 두번째 계정과 일치하지 않습니다.");
            // 값이 hex로 저장되기 때문에 데이터를 일치시키기 위해
            // web3.toAscii를 통해 hex -> string으로 변환.
            // 하지만 그 뒤로도 hex 값 뒤에 000.. 이 남기 때문에
            // replace를 통해 공백을 제거하는 과정.
            assert.equal(web3.toAscii(buyerInfo[1]).replace(/\0/g, ''), "gihong", "매입자의 이름이 'gihong'이 아닙니다.");
            assert.equal(buyerInfo[2], 20, "매입자의 나이가 '20'이 아닙니다.");
            return realEstateInstance.getAllBuyers();
        }).then(function(buyers) {
            assert.equal(buyers[0].toUpperCase(), accounts[1].toUpperCase(), "'Buyers 배열' 첫번째 인덱스의 계정이 Ganache 두번째 계정과 일치하지 않습니다.");
        });
    });
});