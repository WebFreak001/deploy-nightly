# deploy-nightly

Deploy a nightly release to a GitHub release. Supports deleting old nightlys and automatically insert a shortened hash + date.

## Example

```yaml

name: Deploy Nightly
on:
  schedule:
    - cron: '0 2 * * *' # run at 2 AM UTC

jobs:
  nightly:
    name: Deploy nightly
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macOS-latest]
    runs-on: ${{ matrix.os }}
    steps:
      ... # build your asset first

      - name: Deploy Windows release
        if: matrix.os == 'windows-latest'
        uses: WebFreak001/deploy-nightly@v2.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # automatically provided by github actions
        with:
          upload_url: https://uploads.github.com/repos/Pure-D/serve-d/releases/20717582/assets{?name,label} # find out this value by opening https://api.github.com/repos/<owner>/<repo>/releases in your browser and copy the full "upload_url" value including the {?name,label} part
          release_id: 20717582 # same as above (id can just be taken out the upload_url, it's used to find old releases)
          asset_path: ./myapp.zip # path to archive to upload
          asset_name: myapp_windows-nightly-$$.zip # name to upload the release as, use $$ to insert date (YYYYMMDD) and 6 letter commit hash
          asset_content_type: application/zip # required by GitHub API
          max_releases: 7 # optional, if there are more releases than this matching the asset_name, the oldest ones are going to be deleted
          token: *** # optional, a github token. defaults to GITHUB_TOKEN
          sha: 547fdf5 # optional, a commit SHA. Defaults to GITHUB_SHA
          repo: Pure-D/serve-d # optional, the repository where the release is located
```
