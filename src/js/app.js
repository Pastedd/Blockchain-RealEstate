App = {
  web3Provider: null,
  contracts: {},

  init: function() {
   // 탬플렛에서 이미지 파일을 찾고 소스 속성의 json 배열
   // 각 인덱스에 있는 picture 필드의 값을 갖도록 함
    $.getJSON('../real-estate.json', function(data) {
      var list = $('#list');
      var template = $('#template');

      // for loop이 끝나면 10개의 완성된 템플렛을 불러옴
      for (i = 0; i < data.length; i++) {
        template.find('img').attr('src', data[i].picture);
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        // 리스트 변수에 완성된 템플렛을 추가함
        list.append(template.html());
      }
    })

    return App.initWeb3();
  },

  // web3.min.js
  initWeb3: async function() {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.web3Provider = window.ethereum;
        web3 = new Web3(window.ethereum);
      } catch (err) {
        console.log(err.message);
      }
    } else {
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {
    // 컨트랙트
    $.getJSON('RealEstate.json', function(data) {
      // 데이터를 트러플 컨트랙트 라이브러리에서 제공하는
      // 트러플 컨트랙트에 넘겨서 인스턴스화
      App.contracts.RealEstate = TruffleContract(data);
      // web3 공급자의 정보를 갖고 있는 web3provider를 이용해
      // 컨트랙트의 공급자를 설정
      App.contracts.RealEstate.setProvider(App.web3Provider);
      // return App.loadRealEstates();
      App.listenToEvents();
    });
  },

  buyRealEstate: function() {
    var id = $('#id').val();
    var name = $('#name').val();
    var price = $('#price').val();
    var age = $('#age').val();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error); // 에러가 발생했다면 콘솔로 저장
      }

      // 여러개의 계정 중, 첫번째 계정을 가져와 account 변수에 담음
      var account = accounts[0];
      // contract에 접근하는 코드
      App.contracts.RealEstate.deployed().then(function(instance) {
        // 한글이 깨지지 않게 utf8 encoding 사용
        var nameUtf8Encoded = utf8.encode(name);
        // 인코딩시킨 이름을 hex로 변환해서 반환
        // 이름값이 bytes32기 때문에 hex
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from: account, value: price });
      }).then(function() {
        // 인풋값 초기화
        $('#name').val('');
        $('#age').val('');
        // 모달창 닫기
        $('#buyModal').modal('hide');
        // return App.loadRealEstates();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  loadRealEstates: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getAllBuyers.call();
    }).then(function(buyers) {
      for (i = 0; i < buyers.length; i++) {
        // 빈 주소가 없다면
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7);

          // switch를 통해 매각된 부동산을 sold로 표시
          switch(imgType) {
            case 'apartment.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')
              break;
            case 'house.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
              break;
            case 'samsungtower.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/sangsungtower_sold.jpg')
              break;
            case 'gyeongbokgung.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/gyeongbokgung_sold.jpg')
              break;
            case 'piramid.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/piramid_sold.jpg')
              break;
          }

          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    })
  },

  listenToEvents: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      // 0번째 블록부터 최근 블록까지 log를 detect.
      instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest' }).watch(function(error, event) {
        if (!error) {
          // callback 받은 event 로그에서 정보 id 를 받아서 사용
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + ' 번 매물을 매입했습니다.' + '</p>');
        } else { // 에러가 있다면
          console.error(error); // 콘솔에 로그
        }
        App.loadRealEstates();
      })
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });

  // hidden id, price 저장
  $('#buyModal').on('show.bs.modal', function(e) {
    // 해당 탬플렛에 id 필드를 찾고 id 값을 id 변수에 저장
    var id = $(e.relatedTarget).parent().find('.id').text();
    // 탬플렛에서 가져온 ether 값을 float 타입으로 바꾸고 toWei
    // 통해 ether 값을 wei로 변경
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");

    // modal에 있는 id속성이 id, price인 곳을 찾아서 각각의
    // input field에 각각 매물 id와 price 값을 담아둠.

    // bootstrap에 데이터를 전달하는 방식
    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);
  });

  $('#buyerInfoModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();

    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getBuyerInfo.call(id);
    }).then(function(buyerInfo) {
      $(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
      $(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
    }).catch(function(err) {
      console.log(err.message);
    })
  });
});
