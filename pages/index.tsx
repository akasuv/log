import type { NextPage } from "next";
import React, { ReactNode } from "react";
import { DataGrid, GridColDef, GridRowSpacingParams } from "@mui/x-data-grid";
import { Box, Typography, Icon, Button, avatarClasses } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faFaceGrinBeam,
  faFaceSadTear,
  faFaceMeh,
} from "@fortawesome/free-regular-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { ethers } from "ethers";
import {
  faRobot,
  faCircleQuestion,
  faGasPump,
  faHandBackFist,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import type { IconDefinition } from "@fortawesome/free-brands-svg-icons";
import TextField from "@mui/material/TextField";
import {
  ERC721Txn,
  EtherScanERC721TxnListResponse,
  EtherScanNormalTxnListResponse,
  MoralisNFTTxn,
  MoralisNFTTXnListResponse,
  NormalTxn,
  OpenSeaAssetsResponse,
  OpenSeaCollection,
  OpenSeaCollectionsResponse,
  OpenSeaNFT,
  Row,
} from "../types";

const options = { method: "GET", headers: { Accept: "application/json" } };
const openSeaWyvernExchangeContractAddress =
  "0x7f268357A8c2552623316e2562D90e642bB538E5";

const Home: NextPage = () => {
  const [lossOrGain, setLossOrGain] = React.useState<{
    text: string;
    value: number;
    face: IconDefinition;
  }>();
  const [totalProfit, setTotalProfit] = React.useState<number>();
  const [totalInvest, setTotalInvest] = React.useState<number>();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [bufferRows, setBufferRows] = React.useState<Row[]>([]);
  const [address, setAddress] = React.useState<string>();
  const [loadingNFTs, setLoadingNFTs] = React.useState(true);
  const [assets, setAssets] = React.useState<OpenSeaNFT[]>([]);
  const [normalTxnList, setNormalTxnList] = React.useState<NormalTxn[]>([]);
  const [ERC721TxnList, setERC721TxnList] = React.useState<ERC721Txn[]>([]);
  const [loadingAssets, setLoadingAssets] = React.useState<boolean>(false);
  const [apiError, setApiError] = React.useState<string>();
  const [fetchingCollectionRowIndex, setFetchingCollectionRowIndex] =
    React.useState<number>(0);
  const [moralisNFTTxnList, setMoralisNFTTxnList] = React.useState<
    MoralisNFTTxn[]
  >([]);
  const [collections, setCollections] = React.useState<
    Record<string, OpenSeaCollection>
  >({});
  const [lastAvailableRow, setLastAvailableRow] = React.useState<number>(-1);
  const {
    authenticate,
    isAuthenticated,
    isAuthenticating,
    user,
    account,
    logout,
  } = useMoralis();
  const [blockNumberLastWeek, setBlockNumberLastWeek] =
    React.useState<string>();
  const Web3Api = useMoralisWeb3Api();
  const login = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: "Log in using Moralis" })
        .then(function (user) {
        })
        .catch(function (error) {
        });
    }
  };

  const logOut = async () => {
    await logout();
  };

  const columns: GridColDef<Row>[] = [
    {
      field: "imageURL",
      headerName: "",
      renderCell: (params) => (
        <Box sx={{ height: "100%", width: "100%", textAlign: "center" }}>
          <img src={params.row.imageURL} height={"100%"} />
        </Box>
      ),
    },
    {
      field: "title",
      headerName: "Title",
      width: 200,
    },
    {
      field: "floor",
      headerName: "Floor",
      width: 150,
      valueGetter: (params) =>
        params.row.collection?.stats?.floor_price?.toFixed(4) ?? "-",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.5 }}>
          <FontAwesomeIcon icon={faEthereum} />
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "cost",
      headerName: "Cost",
      width: 200,
      valueGetter: (params) =>
        calcCost(
          Number(params.row.txn?.value),
          Number(params.row.txn?.gasUsed),
          Number(params.row.txn?.gasPrice)
        ),
      renderCell: (params) => (
        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.5 }}>
            <FontAwesomeIcon icon={faEthereum} />
            <Typography>{params.value?.toFixed(4) ?? "-"}</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              opacity: 0.5,
              ml: 0.5,
            }}
          >
            {calcGas(
              Number(params.row.txn?.gasUsed),
              Number(params.row.txn?.gasPrice)
            ) > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  columnGap: 0.5,
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon size="sm" icon={faGasPump} />
                <Typography fontSize={12}>
                  {calcGas(
                    Number(params.row.txn?.gasUsed),
                    Number(params.row.txn?.gasPrice)
                  ).toFixed(4)}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      ),
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 180,
      valueGetter: (params) =>
        calcProfit(
          params.row.collection?.stats?.floor_price || 0,
          calcCost(
            Number(params.row.txn?.value),
            Number(params.row.txn?.gasUsed),
            Number(params.row.txn?.gasPrice)
          ) || 0
        )?.toFixed(4) ?? "-",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.5 }}>
          <FontAwesomeIcon icon={faEthereum} />
          <Typography>{params.value}</Typography>
          <Typography
            fontSize={12}
            sx={{
              color:
                calcRoI(
                  params.value,
                  Number(params.row.txn?.value),
                  Number(params.row.txn?.gasUsed),
                  Number(params.row.txn?.gasPrice)
                ) > 0
                  ? "green"
                  : "red",
            }}
          >
            {calcRoI(
              params.value,
              Number(params.row.txn?.value),
              Number(params.row.txn?.gasUsed),
              Number(params.row.txn?.gasPrice)
            ) > 0
              ? "+" +
                calcRoI(
                  params.value,
                  Number(params.row.txn?.value),
                  Number(params.row.txn?.gasUsed),
                  Number(params.row.txn?.gasPrice)
                )
              : calcRoI(
                  params.value,
                  Number(params.row.txn?.value),
                  Number(params.row.txn?.gasUsed),
                  Number(params.row.txn?.gasPrice)
                )}
            %
          </Typography>
        </Box>
      ),
    },
    {
      field: "date",
      headerName: "Holding Days",
      width: 150,
      valueGetter: (params) =>
        params.row.txn?.timestamp ? Number(params.row.txn?.timestamp) : null,
      sortComparator: (v1, v2, cellParams1, cellParams2) =>
        cellParams1.value - cellParams2.value,
      renderCell: (params) =>
        params.value && (
          <Box sx={{ display: "flex", alignItems: "center", columnGap: 0.5 }}>
            <FontAwesomeIcon icon={faHandBackFist} />
            <Typography>{calcHoldingDays(params.value) || "-"}</Typography>
            <Typography fontSize={12} sx={{ opacity: 0.5 }}>
              ({getDate(params.value) || "-"})
            </Typography>
          </Box>
        ),
    },
    {
      field: "permalink",
      headerName: "View",
      width: 200,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            columnGap: 1,
          }}
        >
          <a href={params.row.permalink}>
            <img src={"opensea.svg"} height={20} alt="opensea-link" />
          </a>
          {params.row.txn?.hash && (
            <a href={"https://etherscan.io/tx/" + params.row.txn?.hash}>
              <img src={"etherscan.svg"} height={20} alt="etherscan-link" />
            </a>
          )}
        </Box>
      ),
    },
  ];

  const calcRoI = (
    profit: number = 0,
    value: number = 0,
    gas: number = 0,
    gasPrice: number = 0
  ) => {
    const cost = calcCost(value, gas, gasPrice);
    if (profit === 0 && !cost) {
      return 0;
    }

    if (!cost) {
      return 100;
    }

    return ((profit / (cost || 1)) * 100).toFixed(2);
  };

  React.useEffect(() => {
    getBlockNumberByTimeRange(7);
    (window as any).ethereum?.on(
      "accountsChanged",
      (accounts: Array<string>) => {
        setAddress("0x5fd9b0b7e15b4d106624ea9cf96602996c9c344d");
        // setAddress(accounts[0]);
        localStorage.setItem("address", accounts[0]);
      }
    );
    const address = localStorage.getItem("address");
    if (address) {
      setAddress("0x5fd9b0b7e15b4d106624ea9cf96602996c9c344d");
      // setAddress(address);
    }
  }, []);

  React.useEffect(() => {
    if (address) {
      fetchNormalTxnList();
      fetchERC721TxnList();
      getNFTTxnFromMoralis();
    }
  }, [address]);

  // let value: OpenSeaNFT[] = [];
  let cache: { rows: Row[]; bufferRows: Row[] } = { rows: [], bufferRows: [] };
  const fetchAssets: (next?: string) => void = (next?: string) => {
    let url = `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&limit=50&include_orders=false`;
    if (next) {
      url = url + `&cursor=${next}`;
    }

    setLoadingAssets(true);
    setLoadingNFTs(true);
    fetch(url, options)
      .then((response) => response.json())
      .then((res: OpenSeaAssetsResponse) => {
        const assets = res.assets;
        if (assets) {
          const rows = assets.map((asset) => ({
            id: asset.id,
            tokenType: asset.asset_contract.schema_name,
            collectionName: asset.collection.name,
            title: asset.name,
            permalink: asset.permalink,
            imageURL: asset.image_thumbnail_url,
            tokenID: asset.token_id,
          }));

          const bufferRows = assets.map((asset) => ({
            id: asset.id,
            tokenType: asset.asset_contract.schema_name,
            collectionName: asset.collection.name,
            title: asset.name,
            permalink: asset.permalink,
            imageURL: asset.image_thumbnail_url,
            tokenID: asset.token_id,
            collection: asset.collection,
            contract: asset.asset_contract,
          }));

          cache = {
            rows: cache.rows.concat(rows),
            bufferRows: cache.bufferRows.concat(bufferRows),
          };

          setRows((prev) => prev.concat(rows));
          setBufferRows((prev) => prev.concat(bufferRows));
        }

        if (res.next) {
          fetchAssets(res.next);
        } else {
          // setRows((prev) => prev.concat(cache.rows));
          // setBufferRows((prev) => prev.concat(cache.bufferRows));
          setLoadingNFTs(false);
          setLoadingAssets(false);
        }
      })
      .catch((err) => console.error(err));
  };

  function updateTxn() {
    if (Array.isArray(normalTxnList) && Array.isArray(ERC721TxnList)) {
      const needUpdateRows = bufferRows
        .filter((row) => !Object.hasOwn(row, "txn"))
        .map((row, index) => {
          let hash: string | undefined;
          let timestamp: string | undefined;
          const ERC721Txn = ERC721TxnList.find(
            (txn) =>
              txn.contractAddress === row.contract?.address &&
              txn.tokenID === row.tokenID
          );

          const NFTTxn = moralisNFTTxnList.find(
            (txn) =>
              txn.token_address === row.contract?.address &&
              txn.token_id === row.tokenID
          );

          hash = ERC721Txn?.hash || NFTTxn?.transaction_hash;

          timestamp = String(
            NFTTxn?.block_timestamp &&
              Date.parse(NFTTxn?.block_timestamp) / 1000
          );

          if (hash && normalTxnList) {
            const txn = normalTxnList.find((txn) => txn.hash === hash);
            if (txn) {
              return {
                ...row,
                txn: { ...txn, timestamp },
              };
            }
          }

          return { ...row, txn: { timestamp } };
        });

      if (needUpdateRows.length) {
        const updatedRows = bufferRows.map((row) => {
          const target = needUpdateRows.find((item) => item.id === row.id);
          if (target) {
            return target;
          }
          return row;
        });

        setBufferRows(
          updatedRows.sort(
            (r1, r2) => Number(r2.txn?.timestamp) - Number(r1.txn?.timestamp)
          )
        );

        setRows(
          updatedRows.sort(
            (r1, r2) => Number(r2.txn?.timestamp) - Number(r1.txn?.timestamp)
          )
        );
      }
    }
  }

  React.useEffect(() => {
    if (
      bufferRows.length &&
      bufferRows.some((row) => !Object.hasOwn(row, "txn")) &&
      normalTxnList.length &&
      ERC721TxnList.length &&
      moralisNFTTxnList.length &&
      !loadingAssets
    ) {
      updateTxn();
    }
  }, [normalTxnList, ERC721TxnList, bufferRows, rows, loadingAssets]);

  function getCollections(index: number) {
    const row = bufferRows[index];
    if (!row) {
      setLastAvailableRow(index - 1);
    } else if (row.collection && !collections[row.collection.slug]) {
      setFetchingCollectionRowIndex(index + 1);
      fetch(
        `https://api.opensea.io/api/v1/collection/${row.collection.slug}`,
        options
      )
        .then((res) => res.json())
        .then((res) => {
          setCollections((prev) => ({
            ...prev,
            [row.collection!!.slug]: res.collection,
          }));
          getCollections(index + 1);
        })
        .catch((err) => {
          alert(err);
          setLastAvailableRow(index);
        });
    } else {
      getCollections(index + 1);
    }
  }

  React.useEffect(() => {
    if (
      lastAvailableRow > -1 &&
      bufferRows.length &&
      bufferRows.every((row) => Object.hasOwn(row, "txn"))
    ) {
      if (lastAvailableRow !== bufferRows.length - 1) {
        setApiError(
          `Fetching data from OpenSea failed, only calculated the first ${lastAvailableRow} NFTs performance`
        );
      }

      const totalCost = rows
        .filter((row) => row.collection?.stats !== undefined)
        .reduce(
          (acc, row) =>
            acc +
            (calcCost(
              Number(row.txn?.value),
              Number(row.txn?.gasUsed),
              Number(row.txn?.gasPrice)
            ) || 0),

          0
        );

      const totalValue = rows
        .filter((row) => row.collection?.stats !== undefined)
        .reduce(
          (acc, row) => acc + (Number(row.collection?.stats?.floor_price) || 0),
          0
        );

      const profit = totalValue - totalCost;
      setTotalInvest(totalCost);
      setTotalProfit(profit);
      setLossOrGain({
        text: profit > 0 ? "Gain" : "Loss",
        value: calcTotalRoI(profit, totalCost),
        face: getFaceByProfit(profit),
      });
    }
  }, [bufferRows, lastAvailableRow]);

  React.useEffect(() => {
    if (bufferRows.length && bufferRows.every((row) => row.txn)) {
      getCollections(0);
    }
  }, [bufferRows]);

  React.useEffect(() => {
    if (
      Object.keys(collections).length &&
      bufferRows.some((row) => !row.collection?.stats)
    ) {
      const updatedRows = bufferRows.map((row) => {
        return { ...row, collection: collections[row.collection!!.slug] };
      });

      setRows(updatedRows);
      setBufferRows(bufferRows);
    }
  }, [bufferRows, collections]);

  function fetchCollections() {
    return fetch(
      `https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=300`,
      options
    )
      .then((response) => response.json())
      .then((response: OpenSeaCollectionsResponse) => {
        const slugs = response.map((item) => item.slug);
        return Promise.all(
          slugs.map((slug) =>
            fetch(
              `https://api.opensea.io/api/v1/collection/${slug}`,
              options
            ).then((res) => res.json())
          )
        );
      })
      .catch((err) => console.error(err));
  }

  function fetchNormalTxnList() {
    fetch(
      "http://api.etherscan.io/api" +
        "?module=account" +
        "&action=txlist" +
        `&address=${address}` +
        "&startblock=0" +
        "&endblock=99999999" +
        "&page=1" +
        "&offset=1000" +
        "&sort=desc" +
        "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
    )
      .then((res) => res.json())
      .then((data: EtherScanNormalTxnListResponse) =>
        setNormalTxnList(data.result)
      );
  }

  function getBlockNumberByTimeRange(days: number) {
    const timestamp = Math.round(Date.now() / 1000) - days * 24 * 60 * 60;
    return fetch(
      "https://api.etherscan.io/api" +
        "?module=block" +
        "&action=getblocknobytime" +
        `&timestamp=${timestamp}` +
        "&closest=before" +
        "&apikey=M9T1PI67BAHRJSH4FZ2IR47YACP8SFRV72"
    )
      .then((res) => res.json())
      .then((res) => setBlockNumberLastWeek(res.result));
  }

  function fetchERC721TxnList() {
    return fetch(
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
      .then((data: EtherScanERC721TxnListResponse) =>
        setERC721TxnList(data.result)
      );
  }

  function getNFTTxnFromMoralis() {
    if (address) {
      Web3Api.account
        .getNFTTransfers({ address, limit: 1000 })
        .then((res: MoralisNFTTXnListResponse) =>
          setMoralisNFTTxnList(res.result)
        );
    }
  }

  React.useEffect(() => {
    if (!address) {
      return;
    }

    setRows([]);
    setLastAvailableRow(-1);
    setBufferRows([]);

    fetchAssets();
  }, [address]);

  const calcPurchasePrice = (value: number) => {
    return value / Math.pow(10, 18) || 0;
  };

  const calcGas = (gasUsed: number, gasPrice: number) => {
    return (gasUsed * gasPrice) / Math.pow(10, 18) || 0;
  };

  const calcCost = (price: number, gasUsed: number, gasPrice: number) => {
    return calcPurchasePrice(price) + calcGas(gasUsed, gasPrice) || null;
  };

  const calcProfit = (floor: number, totalSpent: number) => {
    return floor - totalSpent;
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
      logOut();
      return;
    }

    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const accounts = await provider.send("eth_requestAccounts", []);

    if (accounts[0]) {
      login();
      localStorage.setItem("address", accounts[0]);
      // setAddress(accounts[0]);
      setAddress("0x5fd9b0b7e15b4d106624ea9cf96602996c9c344d");
    }
  };

  const calcTotalRoI = (profit: number, spent: number): number => {
    if (profit === 0 && spent === 0) {
      return 0;
    }

    if (spent === 0) {
      return 100;
    }

    return Number(((profit / spent) * 100).toFixed(2));
  };

  const getRowSpacing = React.useCallback((params: GridRowSpacingParams) => {
    return {
      top: params.isFirstVisible ? 0 : 8,
      bottom: params.isLastVisible ? 0 : 8,
    };
  }, []);

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
      {apiError && (
        <Box
          sx={{ p: 2, display: "flex", alignItems: "center", columnGap: 0.5 }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} color={"red"} />
          <Typography sx={{ color: "red" }}>{apiError}</Typography>
        </Box>
      )}
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
          {loadingNFTs ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faRobot} />
              <Typography>Counting NFTs {bufferRows.length}</Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total NFTs
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faChartBar} />
                <Typography fontSize={36} fontWeight={600}>
                  {rows.length}
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
          {!lossOrGain ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faCircleQuestion} />
              <Typography>
                Loss OR Gain ({fetchingCollectionRowIndex} NFTs)...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                {lossOrGain.text}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={lossOrGain.face} />
                <Typography fontSize={36} fontWeight={600}>
                  {lossOrGain.value} %
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
          {totalProfit === undefined ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faEthereum} />
              <Typography>
                Calculating Profit ({fetchingCollectionRowIndex} NFTs)...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total Profit
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faEthereum} />
                <Typography fontSize={36} fontWeight={600}>
                  {totalProfit ? totalProfit.toFixed(4) : "-"}
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
          {totalInvest === undefined ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                columnGap: 1,
              }}
            >
              <FontAwesomeIcon size="lg" icon={faEthereum} />
              <Typography>
                Calculating cost ({fetchingCollectionRowIndex} NFTs)...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography fontSize={16} sx={{ opacity: 0.6 }}>
                Total Investment
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", columnGap: 1 }}>
                <FontAwesomeIcon size="2x" icon={faEthereum} />
                <Typography fontSize={36} fontWeight={600}>
                  {totalInvest > 0 ? totalInvest.toFixed(4) : "-"}
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
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": { border: "none" },
            "& .MuiDataGrid-columnHeaders": {
              border: "none",
            },
            "& .MuiDataGrid-iconSeparator": {
              display: "none",
            },
          }}
          rows={rows}
          columns={columns}
          disableSelectionOnClick
          autoHeight
          density={"comfortable"}
          getRowSpacing={getRowSpacing}
          // initialState={{
          //   sorting: {
          //     sortModel: [{ field: "date", sort: "desc" }],
          //   },
          // }}
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
