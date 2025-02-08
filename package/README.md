# ZÜS JS Client SDK

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

The Züs JS SDK is a JavaScript client library that provides a convenient interface for interacting with the Züs Network. It allows developers to perform various operations such as creating and managing allocations, uploading and downloading files, executing smart contracts, and more.

## Züs Overview

[Züs](https://zus.network/) is a high-performance cloud on a fast blockchain offering privacy and configurable uptime. It is an alternative to traditional cloud S3 and has shown better performance on a test network due to its parallel data architecture. The technology uses erasure code to distribute the data between data and parity servers. Züs storage is configurable to provide flexibility for IT managers to design for desired security and uptime, and can design a hybrid or a multi-cloud architecture with a few clicks using [Blimp's](https://blimp.software/) workflow, and can change redundancy and providers on the fly.

For instance, the user can start with 10 data and 5 parity providers and select where they are located globally, and later decide to add a provider on-the-fly to increase resilience, performance, or switch to a lower cost provider.

Users can also add their own servers to the network to operate in a hybrid cloud architecture. Such flexibility allows the user to improve their regulatory, content distribution, and security requirements with a true multi-cloud architecture. Users can also construct a private cloud with all of their own servers rented across the globe to have a better content distribution, highly available network, higher performance, and lower cost.

[The QoS protocol](https://medium.com/0chain/qos-protocol-weekly-debrief-april-12-2023-44524924381f) is time-based where the blockchain challenges a provider on a file that the provider must respond within a certain time based on its size to pass. This forces the provider to have a good server and data center performance to earn rewards and income.

The [privacy protocol](https://zus.network/build) from Züs is unique where a user can easily share their encrypted data with their business partners, friends, and family through a proxy key sharing protocol, where the key is given to the providers, and they re-encrypt the data using the proxy key so that only the recipient can decrypt it with their private key.

Züs has ecosystem apps to encourage traditional storage consumption such as [Blimp](https://blimp.software/), a S3 server and cloud migration platform, and [Vult](https://vult.network/), a personal cloud app to store encrypted data and share privately with friends and family, and [Chalk](https://chalk.software/), a zero upfront cost permanent storage solution for NFT artists.

Other apps are [Bolt](https://bolt.holdings/), a wallet that is very secure with air-gapped 2FA split-key protocol to prevent hacks from compromising your digital assets, and it enables you to stake and earn from the storage providers; [Atlus](https://atlus.cloud/), a blockchain explorer and [Chimney](https://demo.chimney.software/), which allows anyone to join the network and earn using their server or by just renting one, with no prior knowledge required.


## Resources

- [JS SDK Documentation](https://0chain.github.io/js-sdk/)
- [Go SDK Documentation](https://docs-old.zus.network/guides/zus-gosdk)
- [Whitepapers](https://zus.network/whitepapers/?v=1)
<!--
## Configure package and its deployment on NPM
- Replace all instances of `your-package-name` with your package name
- Replace all instances of `your-org` with your GitHub org name / your username
- Required Settings in Github Repo Settings:
  - Enable Permission: Allow GitHub Actions to create and approve pull requests: https://github.com/changesets/changesets/discussions/1090
  - Add `NPM_TOKEN` to your Repo Actions Secrets.

## Deploy Docusaurus on GitHub pages
- Set GitHub Pages source to "GitHub Actions"
  - Go to Settings -> Pages section -> Build and deployment -> Source: GitHub Actions

## Issues
- Is `changeset` unable to publish? 
  - https://github.com/changesets/action/issues/98#issuecomment-2546826646
-->
