# Seoul Swim Map

서울 안의 수영장을 물개 핀으로 보여주는 모바일 우선 지도 페이지입니다.

## 파일 구성

- `index.html`: 페이지 구조
- `styles.css`: Apple 스타일의 모바일 우선 UI
- `app.js`: 카카오맵 로딩, 검색, 필터, 물개 핀, 정보창
- `pools.js`: 수영장 데이터
- `config.js`: 카카오 JavaScript 키 설정

## 카카오맵 키 설정

1. 카카오 Developers에서 애플리케이션을 만듭니다.
2. 플랫폼 > Web에 사용할 도메인을 등록합니다.
   - 로컬 테스트: `http://localhost:8000`
   - GitHub Pages: `https://사용자명.github.io`
3. 앱 키 > JavaScript 키를 복사합니다.
4. `config.js`를 열고 아래처럼 입력합니다.

```js
window.KAKAO_JAVASCRIPT_KEY = "여기에_JavaScript_키";
```

카카오 JavaScript 키는 프론트엔드에서 노출되는 방식이 일반적입니다. 대신 카카오 Developers에서 Web 도메인을 반드시 제한해 두세요.

## GitHub Pages 배포

1. 이 폴더의 파일을 GitHub 저장소에 올립니다.
2. GitHub 저장소의 Settings > Pages로 이동합니다.
3. Branch를 `main` 또는 사용하는 브랜치로 선택하고 `/root`를 선택합니다.
4. 표시되는 Pages URL을 카카오 Developers Web 플랫폼 도메인에 등록합니다.

## 데이터 수정

수영장 정보는 `pools.js`의 배열에서 관리합니다.

```js
{
  id: "unique-id",
  name: "수영장 이름",
  district: "구",
  address: "주소",
  lat: 37.0,
  lng: 127.0,
  tags: ["public", "indoor"],
  hours: "운영정보",
  price: "가격정보",
  note: "메모"
}
```

가격과 운영시간은 시설 공지에 따라 바뀔 수 있어서 범위와 확인 메모 형태로 넣었습니다. 정확한 값을 원하면 각 시설의 월별 공지 기준으로 `hours`, `price`, `note`를 갱신하면 됩니다.

## 무료 사용 주의점

카카오맵은 무료 쿼터가 있지만, 쿼터를 초과하면 유료 API 정책이 적용될 수 있습니다. 카카오 Developers 앱 관리 페이지에서 쿼터 사용량을 확인하세요.
