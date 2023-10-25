/**
 * This file is licensed under the MIT License.
 * 
 * Some code taken from https://github.com/actions/upload-release-asset
 */

import core from "@actions/core";
import { getOctokit } from '@actions/github';
// import type { GitHub } from '@actions/github/lib/utils';
import fs from "fs";

/**
 * 
 * @param {InstanceType<typeof GitHub>} octokit 
 * @param {*} name 
 */
async function uploadAsset(octokit, name) {
	const url = core.getInput("upload_url", { required: true });
	const assetPath = core.getInput("asset_path", { required: true });
	const contentType = core.getInput("asset_content_type", { required: true });

	const contentLength = filePath => fs.statSync(filePath).size;

	const headers = { 'content-type': contentType, 'content-length': contentLength(assetPath) };

	const uploadAssetResponse = await octokit.rest.repos.uploadReleaseAsset({
		url,
		headers,
		name,
		data: fs.readFileSync(assetPath)
	});

	return uploadAssetResponse.data.browser_download_url;
}

async function run() {
	try {
		const token = core.getInput("token", { required: false });
		const sha = core.getInput("sha", { required: false });
		let repo = core.getInput("repo", { required: false });
		const maxReleases = parseInt(core.getInput("max_releases", { required: false }));
		const releaseId = core.getInput("release_id", { required: true });
		let name = core.getInput("asset_name", { required: true });
		const placeholderStart = name.indexOf("$$");
		const nameStart = name.substring(0, placeholderStart);
		const nameEnd = name.substring(placeholderStart + 2);

		core.info("GITHUB_TOKEN: " + token);
		core.info("GITHUB_SHA: " + sha);
		core.info("GITHUB_REPOSITORY: " + repo);
		
		const octokit = getOctokit(token);
		const hash = sha.substring(0, 6);
		const repository = repo.split('/');
		const owner = repository[0];
		repo = repository[1];

		core.info("hash: " + hash);
		core.info("owner: " + owner);
		core.info("repo: " + repo);

		core.info("Checking previous assets");
		let assets = await octokit.rest.repos.listReleaseAssets({
			owner: owner,
			repo: repo,
			release_id: parseInt(releaseId),
			per_page: 100
		});
		core.info("Checked previous assets");

		assets.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

		/**
		 * @type {number[]}
		 */
		let toDelete = [];
		/**
		 * @type {number | undefined}
		 */
		let existingAssetNameId = undefined;

		let numFound = 0;
		for (let i = 0; i < assets.data.length; i++) {
			const asset = assets.data[i];
			if (asset.name == name) {
				// not commit hash or date in filename, always force upload here
				existingAssetNameId = asset.id;
			} else if (asset.name.startsWith(nameStart) && asset.name.endsWith(nameEnd)) {
				if (asset.name.endsWith("-" + hash + nameEnd)) {
					core.info("Current commit already released, exiting");
					core.setOutput("uploaded", "no");
					return;
				} else {
					numFound++;
					if (numFound >= maxReleases) {
						core.info("Queuing old asset " + asset.name + " for deletion");
						toDelete.push(asset.id);
					}
				}
			}
		}

		let now = new Date();
		let date = now.getUTCFullYear().toString() + pad2((now.getUTCMonth() + 1).toString()) + pad2(now.getUTCDate().toString());

		name = name.replace("$$", date + "-" + hash);

		if (existingAssetNameId !== undefined) {
			core.info("Deleting old asset of same name first");
			await octokit.rest.repos.deleteReleaseAsset({
				owner: owner,
				repo: repo,
				asset_id: existingAssetNameId
			});
		}

		core.info("Uploading asset as file " + name);
		let url = await uploadAsset(octokit, name);

		core.info("Deleting " + toDelete.length + " old assets");
		for (let i = 0; i < toDelete.length; i++) {
			const id = toDelete[i];
			await octokit.rest.repos.deleteReleaseAsset({
				owner: owner,
				repo: repo,
				asset_id: id
			});
		}

		core.setOutput("uploaded", "yes");
		core.setOutput("url", url);
		core.setOutput("asset_name", name);
	} catch (error) {
		core.setFailed(error.message);
	}
}

function pad2(v) {
	v = v.toString();
	while (v.length < 2) v = "0" + v;
	return v;
}

run();
