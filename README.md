# deploy-nightly

Deploy a nightly release to a GitHub release. Supports deleting old nightlys and automatically insert a shortened hash + date.

## Example

```yaml

name: Deploy Nightly
on:
  # This can be used to automatically publish nightlies at UTC nighttime
  schedule:
    - cron: '0 2 * * *' # run at 2 AM UTC
  # This can be used to allow manually triggering nightlies from the web interface
  workflow_dispatch:

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
        uses: WebFreak001/deploy-nightly@v3.1.0
        with:
          upload_url: https://uploads.github.com/repos/Pure-D/serve-d/releases/20717582/assets{?name,label} # find out this value by opening https://api.github.com/repos/<owner>/<repo>/releases in your browser and copy the full "upload_url" value including the {?name,label} part
          release_id: 20717582 # same as above (id can just be taken out the upload_url, it's used to find old releases)
          asset_path: ./myapp.zip # path to archive to upload
          asset_name: myapp_windows-nightly-$$.zip # name to upload the release as, use $$ to insert date (YYYYMMDD) and 6 letter commit hash
          asset_content_type: application/zip # required by GitHub API
          max_releases: 7 # optional, if there are more releases than this matching the asset_name, the oldest ones are going to be deleted
```

### Advanced Use

if you want to publish a release to another repository or from a different commit, you can configure the API token, API repository endpoint and commit sha for the generated filename like this:

```yml
with:
  # can be used to specify a custom token, otherwise defaults to the auto
  # generated token for the current GitHub Action context `${secrets.GITHUB_TOKEN}`
  token: ${secrets.MyCustomToken}
  # used for checking for existing files by inserting into the filename (only
  # the first 6 characters are used)
  sha: 547fdf5
  # this is where the API calls go to list asset files, must match the repo from
  # the upload_url
  repo: Pure-D/serve-d
```
