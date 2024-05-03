import { createReadStream } from 'fs';
import { IPFSHttpClientUploader } from '@lukso/data-provider-ipfs-http-client';

// Pinata
const provider = new PinataUploader({
  pinataApiKey: process.env.TEST_PINATAAPIKEY,
  pinataSecretApiKey: process.env.TEST_PINATASECRETAPIKEY,
});

const file = createReadStream('./path-to-your-file');
const url = await provider.upload(file);

console.log('File URL:', url);

export default function UploadAssets({ gateway, options }: Props) {
  const provider = useMemo(
    () => new IPFSHttpClientUploader(gateway, options),
    []
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [hash, setHash] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const upload = useCallback(async () => {
    const file = fileInput?.current?.files?.item(0) as File;
    const formData = new FormData();
    formData.append("file", file); // FormData keys are called fields
    const { hash, url } = await provider.upload(file);
    setUrl(url);
    setHash(hash);
    // const destination = UrlResolver.resolveUrl(url);
    // setImageUrl(destination);
  }, []);

  return (
    <div>
      <input ref={fileInput} type="file" accept="image/*" />
      <button onClick={upload}>Upload</button>
      <div className="url">{url}</div>
      <div>
        <img className="image" src={imageUrl} alt="uploaded image" />
      </div>
    </div>
  );
}