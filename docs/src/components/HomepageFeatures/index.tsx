import Heading from '@theme/Heading'
import clsx from 'clsx'
import type { JSX } from 'react'
import { BsTools } from 'react-icons/bs'
import { GiGears } from 'react-icons/gi'
import { FaCode } from 'react-icons/fa'
import { IconType } from 'react-icons/lib'

import styles from './styles.module.scss'

type FeatureItem = {
  id: string
  title: string
  Svg: IconType
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    id: 'easy-to-use',
    title: 'Easy to Use',
    // Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    Svg: FaCode,
    description: (
      <>
        The Züs JS SDK provides JavaScript developers with a fully
        TypeScript-based API to interact with the Züs Network, leveraging
        the&nbsp;<a href="https://github.com/0chain/gosdk">GoSDK WASM</a> under
        the hood.
      </>
    ),
  },
  {
    id: 'powereful',
    title: 'Powerful',
    // Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    Svg: GiGears,
    description: (
      <>
        Leverage multi-threaded operations for faster file transfers, enabling
        high-speed and parallel uploads within a single batch for maximum
        efficiency.
      </>
    ),
  },
  {
    id: 'batteries-included',
    title: 'Batteries Included',
    // Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    Svg: BsTools,
    description: (
      <>
        Provides WASM cache management for both standard WASM and enterprise
        WASM. Fetch and initialize WASM asynchronously and switch between both
        WASM types easily.
      </>
    ),
  },
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg size={64} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map(props => (
            <Feature key={props.id} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
