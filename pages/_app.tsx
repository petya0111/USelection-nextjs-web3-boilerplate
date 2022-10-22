import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import React, { createContext, useReducer } from "react";
import getLibrary from "../getLibrary";
import "../styles/globals.css";
import { Contract } from "ethers";
import {
  Alert,
  AlertColor,
  Box,
  LinearProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";

export interface Web3State {
  connected: boolean;
  address: string;
  fetching: boolean;
  contract?: Contract;
  transactionHash?: string;
  message?: string;
  messageType?: AlertColor;
  provider?: any;
  web3Provider?: any;
}

export type Web3Action =
  | {
      type: "connected";
      address: string;
      contract: Contract;
      provider: any;
      web3Provider: any;
    }
  | { type: "fetching"; transactionHash?: string }
  | { type: "fetched"; messageType?: AlertColor; message?: string };

const initialState: Web3State = {
  fetching: false,
  connected: false,
  address: "",
};

function web3Reducer(state: Web3State, action: Web3Action): Web3State {
  switch (action.type) {
    case "connected": {
      return {
        ...state,
        connected: true,
        address: action.address,
        contract: action.contract,
        provider: action.provider,
        web3Provider: action.web3Provider,
      };
    }
    case "fetching": {
      return {
        ...state,
        fetching: true,
        transactionHash: action.transactionHash,
      };
    }
    case "fetched": {
      return {
        ...state,
        fetching: false,
        message: action.message,
        messageType: action.messageType,
      };
    }
  }

  return state;
}

export const Web3Context = createContext<{
  state: Web3State;
  dispatch: React.Dispatch<Web3Action>;
}>({ state: initialState, dispatch: () => {} });

function NextWeb3App({ Component, pageProps }: AppProps) {
  const [state, dispatch] = useReducer(web3Reducer, initialState);
  return (
    <Web3Context.Provider value={{ state, dispatch }}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Component disabled={state.fetching} {...pageProps} />
        {state.fetching && (
          <Box
            sx={{
              height: "calc(100vh - 64px)",
              display: "flex",
              zIndex: 100,
              justifyContent: "center",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <Stack
              spacing={5}
              justifyContent="center"
              alignContent="center"
              alignItems="center"
            >
              <LinearProgress
                sx={{
                  width: "200px",
                }}
              />
              {state.transactionHash && (
                <Box>
                  <Typography>Waiting transation to be mined...</Typography>
                  <Link
                    variant="h5"
                    href={`https://goerli.etherscan.io/tx/${state.transactionHash}`}
                    target="_blank"
                  >
                    {state.transactionHash}
                  </Link>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </Web3ReactProvider>
    </Web3Context.Provider>
  );
}

export default NextWeb3App;
