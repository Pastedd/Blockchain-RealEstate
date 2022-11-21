pragma solidity ^0.4.23;

// Solidity 생성자는 배포할 때 단 한번만 실행하므로
// Testing 을 완벽히 하고, MainNet에 배포하는 것이 중요.
contract RealEstate {
    struct Buyer {
        address buyerAddress;
        bytes32 name;
        uint age;
    }

    // 매물의 ID를 키값으로 할 때 밸류값으로 매입자의 정보 받음
    mapping(uint => Buyer) public buyerInfo; // 매입자의 정보

    address public owner;
    address[30] public buyers;

    // 거래 내역 기록저장 event
    event LogBuyRealEstate(
        address _buyer,
        uint _id
    );

    constructor() public {
        // msg.sender 값을 상태변수 owner에 대입.
        // 즉, 현재 사용하는 계정으로 Contract 안에 있는
        // 생성자나 함수를 불러온다. value : 주소형(address)
        // 해당 Contract의 주인 => 배포할 때 쓰인 현재 계정
        // Ganache 의 첫번째(0) 계정으로 배포.
        owner = msg.sender;
    }

    // 매물구입 함수
    function buyRealEstate(uint _id, bytes32 _name, uint _age) public payable {
        require(_id >= 0 && _id <= 29);
        buyers[_id] = msg.sender; // buyers 배열에 _id 저장
        buyerInfo[_id] = Buyer(msg.sender, _name, _age); // 계정 주소, 이름, 나이 받음

        // ether를 계정에서 계정으로 이동 (ex: 송금)
        owner.transfer(msg.value);
        // 로그 이벤트 발생
        // 로그 기록이 블록에 저장 (ex: 영수증)
        emit LogBuyRealEstate(msg.sender, _id);
    }

    // 읽기 전용 함수 (가스 비용 X)
    // 매입자의 정보를 반환하는 함수
    function getBuyerInfo(uint _id) public view returns(address, bytes32, uint) {
        // buyerInfo에 id를 넘기고 키 값으로 사용한 다음
        // 해당 buyer를 불러와서 변수에 저장.
        // 저장 위치는 memory => 함수가 끝이나면 휘발
        Buyer memory buyer = buyerInfo[_id];
        // 매입자의 계정, 이름, 나이를 리턴하고 함수 종료.
        return (buyer.buyerAddress, buyer.name, buyer.age);
    }

    // 매입자들의 계정 주소를 저장하는 함수
    function getAllBuyers() public view returns (address[30]) {
        return buyers;
    }
}
