import { Column, Img, Row, Text } from "@react-email/components";

function Header() {
  return (
    <Row className="bg-primary">
      <Column style={{ width: 40 }}>
        <Img
          className="p-4"
          width={40}
          height={40}
          src="https://storage.googleapis.com/giga-test-app-static-assets/GIGA_logo.png"
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
