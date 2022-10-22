import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { Web3Context } from "../pages/_app";
import { useContext, useState, useEffect } from "react";
import useUSElectionContract from "../hooks/useUSElectionContract";

type USContract = {
  contractAddress: string;
};

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP,
}

const USLibrary = ({ contractAddress }: USContract) => {
  const { state, dispatch } = useContext(Web3Context);

  const { account, library } = useWeb3React<Web3Provider>();
  const usElectionContract = useUSElectionContract(contractAddress);
  const [currentLeader, setCurrentLeader] = useState<string>("Unknown");
  const [currentVotesTrump, setCurrentVotesTrump] = useState<
    number | undefined
  >();
  const [currentVotesBiden, setCurrentVotesBiden] = useState<
    number | undefined
  >();
  const [name, setName] = useState<string | undefined>();
  const [votesBiden, setVotesBiden] = useState<number | undefined>();
  const [votesTrump, setVotesTrump] = useState<number | undefined>();
  const [stateSeats, setStateSeats] = useState<number | undefined>();

  useEffect(() => {
    getCurrentLeader();
    getSeats();
  }, []);

  const getCurrentLeader = async () => {
    const currentLeader = await usElectionContract.currentLeader();
    setCurrentLeader(
      currentLeader == Leader.UNKNOWN
        ? "Unknown"
        : currentLeader == Leader.BIDEN
        ? "Biden"
        : "Trump"
    );
  };

  const getSeats = async () => {
    const trumpSeats = await usElectionContract.getPresidentSeats(Leader.TRUMP);
    setCurrentVotesTrump(parseInt(trumpSeats.toString()));
    const bidenSeats = await usElectionContract.getPresidentSeats(Leader.BIDEN);
    setCurrentVotesBiden(parseInt(bidenSeats.toString()));
  };

  const stateInput = (input) => {
    setName(input.target.value);
  };

  const bideVotesInput = (input) => {
    setVotesBiden(input.target.value);
  };

  const trumpVotesInput = (input) => {
    setVotesTrump(input.target.value);
  };

  const seatsInput = (input) => {
    setStateSeats(input.target.value);
  };

  const submitStateResults = async () => {
    const result: any = [name, votesBiden, votesTrump, stateSeats];
    // filter events
    // const filterBiddenWinner = usElectionContract.filters.LogStateResult(
    //   Leader.BIDEN,
    //   null,
    //   null
    // );
    // usElectionContract.on(
    //   filterBiddenWinner,
    //   (winner, stateSeats, state, tx) => {
    //     // code for execution
    //   }
    // );
    dispatch({ type: "fetching" });
    try {
      const tx = await usElectionContract.submitStateResult(result);
      dispatch({ type: "fetching", transactionHash: tx.hash });
      const transactionReceipt = await tx.wait();
      if (transactionReceipt.status === 1) {
        dispatch({
          type: "fetched",
          messageType: "success",
          message: "Successfully submitted state result",
        });
        getCurrentLeader();
        getSeats();
      } else {
        dispatch({
          type: "fetched",
          messageType: "error",
          message: JSON.stringify(transactionReceipt),
        });
      }
    } catch (e) {
      dispatch({
        type: "fetched",
        messageType: "error",
        message: e.error.message,
      });
    }
    resetForm();
  };

  const resetForm = async () => {
    setName("");
    setVotesBiden(0);
    setVotesTrump(0);
    setStateSeats(0);
  };

  return (
    <div className="results-form">
      <p>Current Leader is: {currentLeader}</p>
      <div className="leader-results">
        {currentVotesBiden !== undefined && currentVotesTrump !== undefined ? (
          <span>
            Trump seats: {currentVotesTrump} | Biden seats: {currentVotesBiden}
          </span>
        ) : (
          <span></span>
        )}
      </div>
      <form>
        <label>
          State:
          <input
            disabled={state.fetching}
            onChange={stateInput}
            value={name}
            type="text"
            name="state"
          />
        </label>
        <label>
          BIDEN Votes:
          <input
            disabled={state.fetching}
            onChange={bideVotesInput}
            value={votesBiden}
            type="number"
            name="biden_votes"
          />
        </label>
        <label>
          TRUMP Votes:
          <input
            disabled={state.fetching}
            onChange={trumpVotesInput}
            value={votesTrump}
            type="number"
            name="trump_votes"
          />
        </label>
        <label>
          Seats:
          <input
            disabled={state.fetching}
            onChange={seatsInput}
            value={stateSeats}
            type="number"
            name="seats"
          />
        </label>
        {/* <input type="submit" value="Submit" /> */}
      </form>
      <div className="button-wrapper">
        <button disabled={state.fetching} onClick={submitStateResults}>
          Submit Results
        </button>
      </div>
      <style jsx>{`
        .results-form {
          display: flex;
          flex-direction: column;
        }
        .leader-results {
          margin-bottom: 20px;
        }

        .button-wrapper {
          margin: 20px;
        }
      `}</style>
    </div>
  );
};

export default USLibrary;
