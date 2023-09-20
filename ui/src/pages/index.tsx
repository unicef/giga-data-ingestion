import {
  ApiOutlined,
  UploadOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Button } from "antd";

function App() {
  return (
    <div className="h-full bg-[url(/home-bg.jpg)] bg-cover text-white">
      <div className="flex h-full w-full flex-col items-center justify-center backdrop-brightness-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-[40px]">
              <b>Upload</b>
            </h1>
            <p className="text-[20px]">
              Easily upload quality datasets to help connect every school to the
              internet.
            </p>
          </div>
          <div className="flex gap-8">
            <Button
              className="flex h-auto flex-col items-center justify-center gap-4 px-8 py-2"
              ghost
            >
              <UploadOutlined className="text-4xl" />
              Upload File
            </Button>
            <Button
              className="flex h-auto flex-col items-center justify-center gap-4 px-8 py-2"
              ghost
            >
              <ApiOutlined className="text-4xl" />
              Ingest API
            </Button>
            <Button
              className="flex h-auto flex-col items-center justify-center gap-4 px-8 py-2"
              ghost
            >
              <UserSwitchOutlined className="text-4xl" />
              User Management
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 flex flex-auto items-end justify-center gap-24 py-8">
          <a
            href="https://giga.global"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
          >
            <u>Giga Homepage</u>
          </a>
          <a
            href="https://projectconnect.unicef.org/map"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
          >
            <u>Giga Map</u>
          </a>
          <u>DataHub</u>
        </div>
      </div>
    </div>
  );
}

export default App;
