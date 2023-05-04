<!-- Generator: Widdershins v4.0.1 -->

<h1 id="audio-waveform-service-api">Audio Waveform Service API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Service to dynamically produce waveforms for the stems player

Base URLs:

* <a href="https://api.example.com/v1">https://api.example.com/v1</a>

# Authentication

- HTTP Authentication, scheme: bearer 

<h1 id="audio-waveform-service-api-default">Default</h1>

## getM3u8

<a id="opIdgetM3u8"></a>

> Code samples

```http
GET https://api.example.com/v1/waveform?sourceUrl=https%3A%2F%2Fabcdefg01234.cloudfront.net%2Fdrums-wav HTTP/1.1
Host: api.example.com
Accept: application/json

```

`GET /waveform`

*Gets a waveform as json data*

Gets waveform data based on a audio file provided by a URL

<h3 id="getm3u8-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|sourceUrl|query|url|true|none|

> Example responses

> 200 Response

```json
"{\n  \"version\": 2,\n  \"channels\": 1,\n  \"sample_rate\": 44100,\n  \"samples_per_pixel\": 2205,\n  \"bits\": 16,\n  \"length\": 5018,\n  \"data\": [-0.02,-0.02,-0.02,-0.02]\n}\n"
```

<h3 id="getm3u8-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Success|string|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
bearerAuth
</aside>

