// ==UserScript==
// @name        Ez Twimg Downloader Gen2
// @description ツイッターの画像を簡単に保存するUserScriptです。
// @author      00A0
// @match       https://twitter.com/*
// @match       https://x.com/*
// @match       https://pbs.twimg.com/media/*
// @version     3.4
// @grant       GM_download
// @license     The Unlicense
// @updateURL   https://github.com/Yanorei32/EzTwimgDownloaderGen2/raw/master/EzTwimgDownloaderGen2.user.js
// @downloadURL https://github.com/Yanorei32/EzTwimgDownloaderGen2/raw/master/EzTwimgDownloaderGen2.user.js
// ==/UserScript==

(function () {
  'use strict';

  // download filename format
  // https://twitter.com/{userName}/status/{tweetId}
  // https://pbs.twimg.com/media/{randomName}.{extension}
  const FILENAME_FORMAT = 'Twitter-{tweetId}-{userName}-{randomName}.{extension}';
  const processedLists = new WeakMap();

  const addCSS = () => {
    const btnCSS =
      '<style>' +
      '.download:hover>div>button>div>div{color: rgba(29, 161, 242, 1.0);}' +
      '.download:hover>div>button>div>div>div{background-color: rgba(29, 161, 242, 0.1);}' +
      '.download{margin-left: 5%;}' +
      '</style>'
      ;
    document.head.insertAdjacentHTML('beforeend', btnCSS);
  };

  const toArray = (arrayLikeObject) => {
    return Array.prototype.slice.call(arrayLikeObject);
  };

  const getArticleByChildElement = (e) => {
    while (e.tagName != 'ARTICLE') {
      e = e.parentElement;
    }
    return e;
  };

  const parseNewFormatURI = (uri) => {
    const splittedURI = uri.split('/')[4].split('?');
    return {
      'randomName': splittedURI[0],
      'extension': splittedURI[1].split('&')[0].split('=')[1],
    };
  };

  const getTweetInfoByImage = (e) => {
    while (e.tagName != 'A') {
      e = e.parentElement;
    };

    const splittedHref = e.href.split('/');
    return {
      'displayName': splittedHref[3],
      'tweetId': splittedHref[5],
    };
  };

  const getImagesContainerByImageElement = (e) => {
    while (e.tagName != 'A') {
      e = e.parentElement;
    };
    return e.parentElement.parentElement.parentElement.parentElement;
  };

  const addButtons = () => {
    const imgs = document.getElementsByTagName('img');
    if (imgs == undefined) return;

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (img.parentElement.getAttribute('data-testid') != "tweetPhoto") continue;

      const article = getArticleByChildElement(img);
      if (processedLists.has(article)) continue;
      processedLists.set(article, 1);

      let buttonGr = article.querySelector('div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions');
      let buttonPNode = Array.from(buttonGr.querySelectorAll(':scope>div>div, li.tweet-action-item>a, li.tweet-detail-action-item>a')).pop().parentNode;
      let button = buttonPNode.cloneNode(true);
      button.querySelector('svg').innerHTML =
        '<g class="svgDownload">' +
          '<path d="M3,14 v5 q0,2 2,2 h14 q2,0 2,-2 v-5 M7,10 l4,4 q1,1 2,0 l4,-4 M12,3 v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        '</g>'
      ;
      button.classList.add('download');
      buttonGr.insertBefore(button, buttonPNode.nextSibling);

      button.addEventListener('click', () => {
        const tweetImgs = getImagesContainerByImageElement(img).getElementsByTagName('img');
        const tweetInfo = getTweetInfoByImage(img);

        for (let j = 0; j < tweetImgs.length; j++) {
          const parsedURI = parseNewFormatURI(tweetImgs[j].src);
          const maximumQualityURI = `https://pbs.twimg.com/media/${parsedURI.randomName}.${parsedURI.extension}:orig`;
          const downloadFileName = FILENAME_FORMAT
            .replace(/{userName}/g, tweetInfo.displayName)
            .replace(/{tweetId}/g, tweetInfo.tweetId)
            .replace(/{randomName}/g, parsedURI.randomName)
            .replace(/{extension}/g, parsedURI.extension);

          if (!(event || window.event).shiftKey) {
            GM_download(maximumQualityURI, downloadFileName);
          } else {
            window.open(maximumQualityURI);
          };
        }
      });
    }
  };

  //const destroyPromotion = (e) => {
  //  const spantags = e.getElementsByTagName('span');
  //  //getArticleByChildElement(spantags[spantags.length-1]).parentElement.parentElement.parentElement.parentElement.textContent = null;
  //};

  new MutationObserver((records) => {
    records.forEach((record) => {
      toArray(record.addedNodes).forEach((addedNode) => {
        if (addedNode.nodeType != Node.ELEMENT_NODE) return;

        addButtons();
        //destroyPromotion(addedNode);
      });
    });
  }).observe(
    document.body,
    {
      childList: true,
      subtree: true,
    }
  );
  addCSS();
})();
