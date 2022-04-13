import type { NextPage } from "next";
import React from "react";

const Home: NextPage = () => {
  const [normalTxn, setNormalTxn] = React.useState([]);
  const [NFTList, setNFTList] = React.useState([]);
  const [openSeaNFTList, setOpenSeaNFTList] = React.useState([]);
  const [totalProfit, setTotalProfit] = React.useState(0);
  const [totalInvest, setTotalInvest] = React.useState(0);

  React.useEffect(() => {
    const options = { method: "GET", headers: { Accept: "application/json" } };
    fetch(
      "https://api.opensea.io/api/v1/collections?asset_owner=0xbd358966445e1089e3AdD528561719452fB78198&offset=0&limit=300",
      options
    )
      .then((response) => response.json())
      .then((response) => {
        const slugs = response.map((item) => item.slug);
        Promise.all(
          slugs.map((slug) =>
            fetch(`https://api.opensea.io/api/v1/collection/${slug}`, options)
          )
        ).then((responses) => {
          responses.forEach((res) =>
            res.json().then((data) => {
              console.log(data);
              setOpenSeaNFTList((prev) => [...prev, data.collection]);
            })
          );
        });
      })
      .catch((err) => console.error(err));

    fetch(
      "http://api.etherscan.io/api" +
        "?module=account" +
        "&action=txlist" +
        "&address=0xbd358966445e1089e3AdD528561719452fB78198" +
        "&startblock=0" +
        "&endblock=99999999" +
        "&page=1" +
        "&offset=1000" +
        "&sort=asc" +
        "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Normal Txn", data);
        setNormalTxn(data.result);
      });

    fetch(
      "https://api.etherscan.io/api" +
        "?module=account" +
        "&action=tokennfttx" +
        "&address=0xbd358966445e1089e3AdD528561719452fB78198" +
        "&page=1" +
        "&offset=1000" +
        "&startblock=0" +
        "&endblock=99999999999999" +
        "&sort=desc" +
        "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("NFT List", data.result);
        setNFTList(data.result);
      });
  }, []);

  React.useEffect(() => {
    if (NFTList.length && openSeaNFTList.length) {
      const totalProfit = NFTList.reduce(
        (acc, cur) => acc + calcProfit(cur.contractAddress, cur.blockHash),
        0
      );

      const totalInvest = NFTList.reduce(
        (acc, cur) => acc + calcTotal(cur.blockHash),
        0
      );

      setTotalProfit(totalProfit);
      setTotalInvest(totalInvest);
    }
  }, [NFTList, openSeaNFTList]);

  const calcPrice = (blockHash: string) => {
    return (
      normalTxn.find((txn) => txn.blockHash === blockHash)?.value /
        Math.pow(10, 18) || 0
    );
  };

  const calcGas = (blockHash: string) => {
    return (
      (normalTxn.find((txn) => txn.blockHash === blockHash)?.gasPrice *
        normalTxn.find((txn) => txn.blockHash === blockHash)?.gasUsed) /
        Math.pow(10, 18) || 0
    );
  };

  const calcTotal = (blockHash: string) => {
    return calcPrice(blockHash) + calcGas(blockHash) || 0;
  };

  const getFloorPrice = (contractAddress: string) => {
    return (
      openSeaNFTList.find(
        (collection) =>
          collection.primary_asset_contracts[0]?.address === contractAddress
      )?.stats.floor_price || 0
    );
  };

  const calcProfit = (contractAddress: string, blockHash: string) => {
    return getFloorPrice(contractAddress) - calcTotal(blockHash);
  };

  return (
    <div>
      <h1>Log</h1>
      <h2>Total Profit: ${totalProfit}</h2>
      <h2> Total Invest: ${totalInvest}</h2>
      {totalProfit > 0 ? (
        <h3>Gain: {((totalProfit / totalInvest) * 100).toFixed(2)}% </h3>
      ) : (
        <h3>
          Loss: {((Math.abs(totalProfit) / totalInvest) * 100).toFixed(2)} %
        </h3>
      )}
      <ol>
        {NFTList.map((NFT) => (
          <li key={NFT.blockHash}>
            <p>
              Date:
              {new Date(NFT.timeStamp * 1000).getFullYear()}-
              {new Date(NFT.timeStamp * 1000).getMonth()}-
              {new Date(NFT.timeStamp * 1000).getDate()}
            </p>
            <p>Contract address: {NFT.contractAddress}</p>
            <p>Project Name:{NFT.tokenName}</p>
            <p>ID: {NFT.tokenID}</p>
            <p>
              Price:
              {calcPrice(NFT.blockHash)}
            </p>
            <p>
              Gas:
              {calcGas(NFT.blockHash)}
            </p>
            <p>
              Total:
              {calcTotal(NFT.blockHash)}
            </p>
            <p>
              Floor:
              {getFloorPrice(NFT.contractAddress)}
            </p>
            <p>
              Profit:
              {calcProfit(NFT.contractAddress, NFT.blockHash)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Home;
