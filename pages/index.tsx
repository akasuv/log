import type { NextPage } from "next";
import React from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { Box, Typography, Icon, Button } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faFaceGrinBeam,
  faFaceSadTear,
  faFaceMeh,
} from "@fortawesome/free-regular-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { ethers } from "ethers";
import { faRobot, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

const Home: NextPage = () => {
  const [normalTxn, setNormalTxn] = React.useState([]);
  const [NFTList, setNFTList] = React.useState([]);
  const [openSeaNFTList, setOpenSeaNFTList] = React.useState([]);
  const [totalProfit, setTotalProfit] = React.useState(0);
  const [totalInvest, setTotalInvest] = React.useState(0);
  const [rows, setRows] = React.useState([]);
  const [address, setAddress] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  const columns: GridColDef[] = [
    {
      field: "projectName",
      headerName: "Project name",
      width: 150,
    },
    {
      field: "floor",
      headerName: "Floor",
      width: 150,
    },
    {
      field: "purchasePrice",
      headerName: "Purchase Price",
      width: 150,
    },
    {
      field: "gas",
      headerName: "Gas",
      width: 150,
      valueGetter: (params) =>
        params.row.gas === 0 ? 0 : params.row.gas.toFixed(4),
    },
    {
      field: "totalSpent",
      headerName: "Total Spent",
      width: 150,
      valueGetter: (params) =>
        params.row.totalSpent === 0 ? 0 : params.row.totalSpent.toFixed(4),
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 150,
      valueGetter: (params) =>
        params.row.profit === 0 ? 0 : params.row.profit.toFixed(4),
    },
    {
      field: "roi",
      headerName: "RoI",
      width: 150,
      valueGetter: (params) =>
        calcRoI(params.row.profit, params.row.totalSpent) + "%",
    },
    {
      field: "date",
      headerName: "Purchase Date",
      width: 150,
    },
    {
      field: "holdingDays",
      headerName: "Holding Days",
      width: 150,
      valueGetter: (params) => params.row.holdingDays.toFixed(0),
    },
  ];

  const calcRoI = (profit: number, spent: number) => {
    if (profit === 0 && spent === 0) {
      return 0;
    }
    if (spent === 0) {
      return (profit * 100).toFixed(2);
    }

    return ((profit / spent) * 100).toFixed(2);
  };

  React.useEffect(() => {
    (window as any).ethereum.on(
      "accountsChanged",
      (accounts: Array<string>) => {
        setAddress(accounts[0]);
        localStorage.setItem("address", accounts[0]);
        setNFTList([]);
        setOpenSeaNFTList([]);
      }
    );
    const address = localStorage.getItem("address");
    if (address) {
      setAddress(address);
    }
  }, []);

  React.useEffect(() => {
    if (!address) {
      setNFTList([]);
      setOpenSeaNFTList([]);
      return;
    }
    setLoading(true);
    const options = { method: "GET", headers: { Accept: "application/json" } };
    Promise.all([
      fetch(
        `https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=300`,
        options
      )
        .then((response) => response.json())
        .then((response) => {
          const slugs = response.map((item: any) => item.slug);
          return Promise.all(
            slugs.map((slug: any) =>
              fetch(
                `https://api.opensea.io/api/v1/collection/${slug}`,
                options
              ).then((res) => res.json())
            )
          );
        })
        .catch((err) => console.error(err)),

      fetch(
        "http://api.etherscan.io/api" +
          "?module=account" +
          "&action=txlist" +
          `&address=${address}` +
          "&startblock=0" +
          "&endblock=99999999" +
          "&page=1" +
          "&offset=1000" +
          "&sort=asc" +
          "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
      )
        .then((res) => res.json())
        .then((data) => data.result),

      fetch(
        "https://api.etherscan.io/api" +
          "?module=account" +
          "&action=tokennfttx" +
          `&address=${address}` +
          "&page=1" +
          "&offset=1000" +
          "&startblock=0" +
          "&endblock=99999999999999" +
          "&sort=desc" +
          "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
      )
        .then((res) => res.json())
        .then((data) => data.result),
    ]).then((values) => {
      console.log("values", values);
      setLoading(false);
      setOpenSeaNFTList(values[0] as any);
      setNormalTxn(values[1]);
      setNFTList(values[2]);
    });
  }, [address]);

  React.useEffect(() => {
    const totalProfit = NFTList.reduce(
      (acc, cur: any) => acc + calcProfit(cur.contractAddress, cur.blockHash),
      0
    );

    const totalInvest = NFTList.reduce(
      (acc, cur: any) => acc + calcTotal(cur.blockHash),
      0
    );

    setTotalProfit(totalProfit);
    setTotalInvest(totalInvest);

    const rows = NFTList.map((NFT: any, index) => {
      return {
        id: index + 1,
        projectName: NFT.tokenName,
        purchasePrice: calcPrice(NFT.blockHash),
        gas: calcGas(NFT.blockHash),
        totalSpent: calcTotal(NFT.blockHash),
        floor: getFloorPrice(NFT.contractAddress),
        profit: calcProfit(NFT.contractAddress, NFT.blockHash),
        date: getDate(NFT.timeStamp),
        holdingDays: calcHoldingDays(NFT.timeStamp),
      };
    });

    setRows(rows as any);
  }, [NFTList, openSeaNFTList]);

  const calcPrice = (blockHash: string) => {
    return (
      (normalTxn.find((txn: any) => txn.blockHash === blockHash) as any)
        ?.value / Math.pow(10, 18) || 0
    );
  };

  const calcGas = (blockHash: string) => {
    return (
      ((normalTxn.find((txn: any) => txn.blockHash === blockHash) as any)
        ?.gasPrice *
        (normalTxn.find((txn: any) => txn.blockHash === blockHash) as any)
          ?.gasUsed) /
        Math.pow(10, 18) || 0
    );
  };

  const calcTotal = (blockHash: string) => {
    return calcPrice(blockHash) + calcGas(blockHash) || 0;
  };

  const getFloorPrice = (contractAddress: string) => {
    return (
      ( openSeaNFTList.find(
        (nft:any) =>
          nft.collection.primary_asset_contracts[0]?.address === contractAddress
      ) as any)?.collection.stats.floor_price || 0
    );
  };

  const calcProfit = (contractAddress: string, blockHash: string) => {
    return getFloorPrice(contractAddress) - calcTotal(blockHash);
  };

  const calcHoldingDays = (timestamp: number) => {
    return Math.ceil((Date.now() - timestamp * 1000) / 1000 / 60 / 60 / 24);
  };

  const getDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month < 10 ? "0" + month : month}-${
      day < 10 ? "0" + day : day
    }`;
  };

  const connectToMetaMask = async () => {
    if (address) {
      setAddress(undefined);
      return;
    }
    const provider = new ethers.providers.Web3Provider(( window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    if (accounts[0]) {
      localStorage.setItem("address", accounts[0]);
      setAddress(accounts[0]);
    }
  };

  const calcTotalRoI = (profit: number, spent: number) => {
    if (profit === 0 && spent === 0) {
      return 0;
    }

    if (spent === 0) {
      return profit * 100;
    }

    return ((profit / spent) * 100).toFixed(2);
  };

  const getFaceByProfit = (profit: number) => {
    if (profit === 0) {
      return faFaceMeh;
    }

    if (profit > 0) {
      return faFaceGrinBeam;
    }

    return faFaceSadTear;
  };

  return address ? (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant={"h1"} fontSize={34} fontWeight={700}>
          LOG
        </Typography>
        <Button
          onClick={connectToMetaMask}
          variant="outlined"
          sx={{
            height: 64,
            width: 200,
            textTransform: "unset",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: 1,
            }}
          >
            <img src="metamask-fox.png" height={40} />
            <Typography>
              {address.split("").slice(0, 6).join("") +
                "..." +
                address.split("").slice(38).join("")}
            </Typography>
            <Box
              sx={{
                width: 8,
                height: 8,
                backgroundColor: "#00e400",
                borderRadius: 10,
              }}
            />
          </Box>
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 2,
          columnGap: 4,
        }}
      >
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
            borderRadius: 2,
            height: 110,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faRobot} />
              <Typography>Counting NFTs...</Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total NFTs
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faChartBar} />
                <Typography fontSize={36} fontWeight={600}>
                  {openSeaNFTList.length}
                </Typography>
              </Box>
            </>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
            borderRadius: 1,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faCircleQuestion} />
              <Typography>Loss OR Gain</Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                {totalProfit > 0 ? "Gain" : "Loss"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon
                  size="2x"
                  icon={getFaceByProfit(totalProfit)}
                />
                <Typography fontSize={36} fontWeight={600}>
                  {calcTotalRoI(totalProfit, totalInvest)} %
                </Typography>
              </Box>
            </>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
            borderRadius: 1,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faEthereum} />
              <Typography>Calculating Profit...</Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total Profit
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faEthereum} />
                <Typography fontSize={36} fontWeight={600}>
                  {totalProfit.toFixed(4)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px",
            borderRadius: 2,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faEthereum} />
              <Typography>Calculating cost...</Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total Investment
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faEthereum} />
                <Typography fontSize={36} fontWeight={600}>
                  {totalInvest.toFixed(4)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
      <Box>
        <Typography
          variant="h3"
          sx={{
            fontSize: 20,
            fontWeight: 600,
            my: 2,
          }}
        >
          All Holdings
        </Typography>
        <DataGrid
          rows={rows}
          columns={columns}
          disableSelectionOnClick
          autoHeight
        />
      </Box>
    </Box>
  ) : (
    <NotConnectedDisplay handleClick={connectToMetaMask} />
  );
};

const NotConnectedDisplay: React.FC<{ handleClick: () => void }> = ({
  handleClick,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: 6,
        }}
      >
        <Typography variant="h1" fontWeight={600}>
          LOG
        </Typography>
        <Box mt={2} textAlign="center">
          <Typography variant="subtitle1" fontSize={20}>
            Loss or gain?
          </Typography>
          <Typography variant="subtitle1" fontSize={20}>
            Check your NFT investment status
          </Typography>
        </Box>
      </Box>
      <Button
        onClick={handleClick}
        variant="outlined"
        sx={{
          height: 64,
          width: 200,
          textTransform: "unset",
          mb: 2,
        }}
      >
        <img src="metamask-wordmark.png" width="100%" height="100%" />
      </Button>
      <Typography sx={{ opacity: 0.6 }}>Connect to MetaMask</Typography>
    </Box>
  );
};

export default Home;
