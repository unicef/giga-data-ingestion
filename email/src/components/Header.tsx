import { Column, Img, Row, Text } from "@react-email/components";

import { blobAssetUrls } from "../constants/blob-assets";

function Header() {
  return (
    <Row className="bg-primary">
      <Column style={{ width: 40 }}>
        <Img
          className="p-4"
          width={40}
          height={40}
          src={blobAssetUrls.gigaLogo()}
        />
      </Column>
      <Column>
        <Text className="text-white text-2xl">
          <span className="font-light">giga</span>
          <span className="font-bold">sync</span>
        </Text>
      </Column>
    </Row>
  );
}

export default Header;
