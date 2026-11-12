// ==UserScript==
// @name        Ez Twimg Downloader Gen2
// @description ツイッターの画像を簡単に保存するUserScriptです。
// @author      00A0
// @match       https://twitter.com/*
// @match       https://x.com/*
// @match       https://pbs.twimg.com/media/*
// @version     4.3
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
			'.download:hover >div > button > div > div {color: rgba(29, 161, 242, 1.0);}' +
			'.download:hover >div > button > div > div > div {background-color: rgba(29, 161, 242, 0.1);}' +
			'.download {margin-left: 5%;}' +
			'.download-profile {position: absolute; right: 0;}' +
			'.download-profile > div {display: flex; border-radius: 99px; margin: 2px; background-color: #1b384a;}' +
			'.download-profile > div > div {display: flex; margin: 6px; color: #fff;}' +
			'.download-profile:hover > div {cursor: pointer; background-color: #fff;}' +
			'.download-profile:hover > div > div {color: rgba(29, 161, 242, 1.0);}' +
			'.download-profile:not(:hover) > div > div {filter: drop-shadow(0 0 1px #000);}' +
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

	const addButtons = (node) => {
		let checkMediaNode = node.tagName == 'ARTICLE' && node || node.tagName == 'DIV' && (node.querySelector('article') || node.closest('article'));
		let checkProfileMediaNode = node.tagName == 'LI' && node.getAttribute('role') == 'listitem' && [node] || node.tagName == 'DIV' && node.querySelectorAll('li[role="listitem"]');
			  const imgsNode = document.getElementsByTagName('img');

		if (checkMediaNode) {
			for (let i = 0; i < imgsNode.length; i++) {
				const img = imgsNode[i];
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
					const imgsElements = getImagesContainerByImageElement(img).parentElement.getElementsByTagName('img');
					const imgsInfo = getTweetInfoByImage(img);

					for (let j = 0; j < imgsElements.length; j++) {
						const parsedURI = parseNewFormatURI(imgsElements[j].src);
						const maximumQualityURI = `https://pbs.twimg.com/media/${parsedURI.randomName}.${parsedURI.extension}:orig`;
						const downloadFileName = FILENAME_FORMAT
							.replace(/{userName}/g, imgsInfo.displayName)
							.replace(/{tweetId}/g, imgsInfo.tweetId)
							.replace(/{randomName}/g, parsedURI.randomName)
							.replace(/{extension}/g, parsedURI.extension);

						GM_download(maximumQualityURI, downloadFileName);
					}
				});
			}
		} else if (checkProfileMediaNode) {
			for (let k = 0; k < checkProfileMediaNode.length; k++) {
				const profileImgNode = checkProfileMediaNode[k];
				if (profileImgNode.getAttribute('data-testid') != null) continue;
		
				let button = document.createElement('div');
				button.innerHTML =
					'<div><div><svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><g class="svgDownload">' +
					'<path d="M3,14 v5 q0,2 2,2 h14 q2,0 2,-2 v-5 M7,10 l4,4 q1,1 2,0 l4,-4 M12,3 v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
													'</g></svg></div></div>'
				;
				button.classList.add('download-profile');
				profileImgNode.appendChild(button);
		
				button.addEventListener('click', () => {
					const img = profileImgNode.getElementsByTagName('img')[0];
					const imgsElements = getImagesContainerByImageElement(img).getElementsByTagName('img');
					const imgsInfo = getTweetInfoByImage(img);
		
					for (let l = 0; l < imgsElements.length; l++) {
						const parsedURI = parseNewFormatURI(imgsElements[l].src);
						const maximumQualityURI = `https://pbs.twimg.com/media/${parsedURI.randomName}.${parsedURI.extension}:orig`;
						const downloadFileName = FILENAME_FORMAT
							.replace(/{userName}/g, imgsInfo.displayName)
							.replace(/{tweetId}/g, imgsInfo.tweetId)
							.replace(/{randomName}/g, parsedURI.randomName)
							.replace(/{extension}/g, parsedURI.extension);
		
						GM_download(maximumQualityURI, downloadFileName);
					}
				});
			}
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
	
				addButtons(addedNode);
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

