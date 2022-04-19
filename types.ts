type TokenType = "ERC721" | "ERC1155";

export type OpenSeaUser = {
  user: {
    username: null | string;
  };
  profile_img_url: string;
  address: string;
  config: string;
};

export type OpenSeaNFT = {
  id: number;
  num_sales: number;
  background_color: null | string;
  image_url: string;
  image_preview_url: string;
  image_thumbnail_url: string;
  image_original_url: string;
  animation_url: string;
  animation_original_url: string;
  name: string;
  description: string;
  external_link: null | string;
  asset_contract: OpenSeaContract;
  permalink: string;
  collection: OpenSeaCollection;
  decimals: number;
  token_metadata: string;
  is_nsfw: boolean;
  owner: OpenSeaUser;
  sell_orders: null | string;
  creator: OpenSeaUser;
  traits: [];
  last_sale: null | number;
  top_bid: null | number;
  listing_date: null | number;
  is_presale: boolean;
  transfer_fee_payment_token: null | number;
  transfer_fee: null | number;
  token_id: string;
};

export type OpenSeaCollection = {
  banner_image_url: null | string;
  chat_url: null | string;
  created_date: string;
  default_to_fiat: boolean;
  description: string;
  dev_buyer_fee_basis_points: string;
  dev_seller_fee_basis_points: string;
  discord_url: null;
  display_data: {
    card_display_style: string;
  };
  external_url: string;
  featured: false;
  featured_image_url: string;
  hidden: false;
  safelist_request_status: string;
  image_url: string;
  is_subject_to_whitelist: false;
  large_image_url: string;
  medium_username: null;
  name: string;
  only_proxied_transfers: false;
  opensea_buyer_fee_basis_points: string;
  opensea_seller_fee_basis_points: string;
  payout_address: null;
  require_email: false;
  short_description: null;
  slug: string;
  telegram_url: null;
  twitter_username: null;
  instagram_username: null;
  wiki_url: null;
  is_nsfw: false;
  stats?: OpenSeaCollectionStats;
  primary_asset_contracts?: OpenSeaContract[];
};

export type OpenSeaCollectionStats = {
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  one_day_average_price: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  seven_day_average_price: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
  thirty_day_average_price: number;
  total_volume: number;
  total_sales: number;
  total_supply: number;
  count: number;
  num_owners: number;
  average_price: number;
  num_reports: number;
  market_cap: number;
  floor_price: number;
};

export type OpenSeaContract = {
  address: string;
  asset_contract_type: string;
  created_date: string;
  name: string;
  nft_version: string;
  opensea_version: null | string;
  owner: number;
  schema_name: string;
  symbol: string;
  total_supply: string;
  description: string;
  external_link: string;
  image_url: string;
  default_to_fiat: boolean;
  dev_buyer_fee_basis_points: number;
  dev_seller_fee_basis_points: number;
  only_proxied_transfers: boolean;
  opensea_buyer_fee_basis_points: number;
  opensea_seller_fee_basis_points: number;
  buyer_fee_basis_points: number;
  seller_fee_basis_points: number;
  payout_address: null | string;
};

export interface NFT {
  collectionName: string;
  tokenType: string;
  title: string;
  permalink: string;
  imageURL: string;
  tokenID: string;
}

export type Collection = {
  name: string;
  contractAddress: string;
  floor: number;
};

export type NormalTxn = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
};

export type ERC721Txn = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type MoralisNFTTxn = {
  token_address: string;
  token_id: string;
  from_address?: string | undefined;
  to_address: string;
  value?: string | undefined;
  amount?: string | undefined;
  contract_type: string;
  block_number: string;
  block_timestamp: string;
  block_hash: string;
  transaction_hash: string;
  transaction_type?: string | undefined;
  transaction_index?: string | undefined;
  log_index: number;
  operator?: string | undefined;
};

export type OpenSeaAssetsResponse = {
  next: null | string;
  previou: null | string;
  assets: OpenSeaNFT[];
};

export type OpenSeaCollectionsResponse = OpenSeaCollection[];

export type EtherScanNormalTxnListResponse = {
  message: string;
  result: NormalTxn[];
  status: string;
};

export type EtherScanERC721TxnListResponse = {
  message: string;
  result: ERC721Txn[];
  status: string;
};

export type MoralisNFTTXnListResponse = {
  total: number;
  page: number;
  page_size: number;
  result: MoralisNFTTxn[];
  block_exists?: boolean | undefined;
  index_complete?: boolean | undefined;
};

export interface Row extends NFT {
  id: string | number;
  txn?: Partial<Omit<NormalTxn, "timeStamp"> & { timestamp: string }> | null;
  collection?: OpenSeaCollection;
  contract?: OpenSeaContract;
}
