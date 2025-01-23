// Cesium Viewerの初期化

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MWY1ODc5Zi04YTcyLTQ5NDQtYTUyYy02OTRiZTE1MjViZDQiLCJpZCI6MjcwODg1LCJpYXQiOjE3Mzc2MDM2NzZ9.Q9w-zN-GSeAS48BrVPD98av8mYeCIm1CXFOhhjJDJRQ';
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrainProvider: Cesium.createWorldTerrain()
});

// 3Dタイルセットの読み込み
const tilesetUrl = './tileset.json'; // tileset.jsonのパス
const tileset = new Cesium.Cesium3DTileset({ url: tilesetUrl });
viewer.scene.primitives.add(tileset);

// タイルセットの準備完了後に処理を開始
tileset.readyPromise
  .then(() => {
    console.log("タイルセットが読み込まれました");

    // タイルセットを中心にズーム
    viewer.zoomTo(tileset);

    // 現在地を取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const userHeight = 0; // 必要に応じて現在地の高さを設定

          // 現在地をCartesian3に変換
          const userPosition = Cesium.Cartesian3.fromDegrees(userLon, userLat, userHeight);

          // 最も近い建物を特定するロジック
          findNearestBuilding(userPosition, tileset);
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("このブラウザでは位置情報がサポートされていません");
    }
  })
  .otherwise((error) => {
    console.error("タイルセットの読み込み中にエラーが発生しました:", error);
  });

// 最も近い建物を特定してハイライトする関数
function findNearestBuilding(userPosition, tileset) {
  let nearestFeature = null;
  let minDistance = Infinity;

  // タイル内の建物をチェック
  tileset.tileVisible.addEventListener((tile) => {
    if (tile.content.featuresLength) {
      for (let i = 0; i < tile.content.featuresLength; i++) {
        const feature = tile.content.getFeature(i);
        const boundingVolume = feature.boundingVolume;

        // バウンディングボリュームがBoundingSphereの場合
        if (boundingVolume instanceof Cesium.BoundingSphere) {
          const center = Cesium.Matrix4.multiplyByPoint(
            tile.content.boundingVolume.boundingVolumeMatrix,
            boundingVolume.center,
            new Cesium.Cartesian3()
          );

          const distance = Cesium.Cartesian3.distance(userPosition, center);

          if (distance < minDistance) {
            minDistance = distance;
            nearestFeature = feature;
          }
        }
      }
    }
  });

  // 最も近い建物をハイライト
  setTimeout(() => {
    if (nearestFeature) {
      nearestFeature.color = Cesium.Color.RED.withAlpha(0.6); // 赤色でハイライト
      console.log("最寄りの建物:", nearestFeature, `距離: ${minDistance.toFixed(2)} m`);
    } else {
      console.log("最寄りの建物が見つかりませんでした");
    }
  }, 1000); // 
}

