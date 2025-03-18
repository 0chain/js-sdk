import { useCallback, useEffect, useState, version } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useWasmLoader } from '@zerochain/sdk/dist/react';
import sdk from '@zerochain/sdk';

// import toast from 'react-toastify';

function App() {

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <h2>Check console for logs</h2>
        <ZcnWasmLoader />

      </div>

    </>
  );
}

export default App;

const SHOW_WASM_LOAD_LOGS = true;
export const ZcnWasmLoader = () => {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  useEffect(() => {
    if (SHOW_WASM_LOAD_LOGS)
      console.log('%cLOG Wasm loaded: ', 'color: steelblue;', isWasmLoaded);
  }, [isWasmLoaded]);


  // WASM LOGGER
  const onLog = useCallback((...args) => {
    const [type, log] = args;
    // if (type === 'error') toast.error(log);
    if (SHOW_WASM_LOAD_LOGS) console[type]('WASM:', log.message, log);
  }, []);


  // Intialize WASM
  const loadWasm = useWasmLoader({ onLog, setIsWasmLoaded });
  useEffect(() => {
    if (!isWasmLoaded) {
      loadWasm({
        useCachedWasm: true,
        cacheConfig: {
          standardGosdkVersion: "1.19.10",
          standardWasmUrl: "/zcn-1.19.9-normal.wasm",
        },

        // Set other options as needed
        md5WorkerUrl: 'md5worker.js',
        wasmBaseUrl: '/wasm',
      });
    }
  }, [isWasmLoaded, loadWasm]);

  const [wasmVersion, setWasmVersion] = useState(null);

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <pre>
        <b>
          STATUS:
        </b>
        {isWasmLoaded ? ' Wasm loaded' : ' Loading...'}
      </pre>

      <button onClick={() => {
        logWasmVersion().then(version => setWasmVersion(version)).catch(console.error);
      }}>Get Wasm Version</button>

      {wasmVersion ? <p>Wasm Version: {wasmVersion}</p> : <p>&nbsp;</p>}
    </div>
  );
};

async function logWasmVersion() {
  const domain = "mainnet.zus.network";
  const version = await sdk.getGosdkVersion(domain);
  console.log('WASM Version:', version);
  return version;
}
