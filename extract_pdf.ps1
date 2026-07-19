param(
    [string]$PdfPath = "C:\Users\Admin\Downloads\Rizal's Childhood.pdf",
    [string]$OutPath = "C:\Users\Admin\Downloads\rizal_extracted.txt"
)

Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;

public static class MiniPdfText
{
    public static string Extract(string path)
    {
        byte[] bytes = File.ReadAllBytes(path);
        string raw = Latin1(bytes);

        var sb = new StringBuilder();
        int pos = 0;

        while (true)
        {
            if (pos < 0 || pos >= raw.Length) break;
            int streamIdx = raw.IndexOf("stream", pos, StringComparison.Ordinal);
            if (streamIdx < 0) break;

            int nextPos = streamIdx + 6; // fallback advance so we never infinite-loop

            try
            {
                // find the dictionary that precedes this stream (from nearest preceding "obj")
                int objIdx = -1;
                if (streamIdx > 0)
                {
                    int searchFrom = streamIdx - 1;
                    objIdx = raw.LastIndexOf(" obj", searchFrom, StringComparison.Ordinal);
                }
                string dict = objIdx >= 0 ? raw.Substring(objIdx, streamIdx - objIdx) : "";

                // move past the "stream" keyword + EOL (\r\n or \n)
                int dataStart = streamIdx + 6;
                if (dataStart < raw.Length && raw[dataStart] == '\r') dataStart++;
                if (dataStart < raw.Length && raw[dataStart] == '\n') dataStart++;

                if (dataStart >= raw.Length) break;
                int endIdx = raw.IndexOf("endstream", dataStart, StringComparison.Ordinal);
                if (endIdx < 0) break;

                nextPos = endIdx + 9;

                int dataLen = endIdx - dataStart;
                if (dataLen < 0) { pos = nextPos; continue; }
                // trim trailing EOL before endstream
                while (dataLen > 0 && (raw[dataStart + dataLen - 1] == '\n' || raw[dataStart + dataLen - 1] == '\r'))
                    dataLen--;

                byte[] streamBytes = new byte[dataLen];
                Array.Copy(bytes, dataStart, streamBytes, 0, dataLen);

                bool isFlate = dict.IndexOf("/FlateDecode", StringComparison.Ordinal) >= 0;

                byte[] finalBytes = null;
                if (isFlate)
                {
                    try { finalBytes = Inflate(streamBytes); }
                    catch { finalBytes = null; }
                }

                if (finalBytes != null)
                {
                    string content = Latin1(finalBytes);
                    if (LooksLikeContentStream(content))
                    {
                        string extracted = ExtractTextOperators(content);
                        if (!string.IsNullOrWhiteSpace(extracted))
                        {
                            sb.Append(extracted);
                            sb.Append("\n\n");
                        }
                    }
                }
            }
            catch
            {
                // malformed / non-text stream (image, xref, object stream, etc.) - skip it
            }

            pos = nextPos;
        }

        return sb.ToString();
    }

    static bool LooksLikeContentStream(string s)
    {
        return s.IndexOf("Tj", StringComparison.Ordinal) >= 0
            || s.IndexOf("TJ", StringComparison.Ordinal) >= 0;
    }

    static string Latin1(byte[] bytes)
    {
        var chars = new char[bytes.Length];
        for (int i = 0; i < bytes.Length; i++) chars[i] = (char)bytes[i];
        return new string(chars);
    }

    static byte[] Inflate(byte[] zlibData)
    {
        if (zlibData.Length < 3) throw new InvalidDataException("stream too short");
        // skip 2-byte zlib header
        using (var input = new MemoryStream(zlibData, 2, zlibData.Length - 2))
        using (var deflate = new DeflateStream(input, CompressionMode.Decompress))
        using (var output = new MemoryStream())
        {
            deflate.CopyTo(output);
            return output.ToArray();
        }
    }

    static string ExtractTextOperators(string content)
    {
        var sb = new StringBuilder();
        int i = 0;
        int n = content.Length;

        while (i < n)
        {
            char c = content[i];

            if (c == '(')
            {
                // literal string until matching unescaped ')'
                int depth = 1;
                int start = i + 1;
                int j = start;
                var lit = new StringBuilder();
                while (j < n && depth > 0)
                {
                    char cj = content[j];
                    if (cj == '\\' && j + 1 < n)
                    {
                        char esc = content[j + 1];
                        switch (esc)
                        {
                            case 'n': lit.Append('\n'); break;
                            case 'r': lit.Append('\r'); break;
                            case 't': lit.Append('\t'); break;
                            case '(': lit.Append('('); break;
                            case ')': lit.Append(')'); break;
                            case '\\': lit.Append('\\'); break;
                            default:
                                if (char.IsDigit(esc))
                                {
                                    // octal escape, up to 3 digits
                                    int k = j + 1;
                                    int digits = 0;
                                    string oct = "";
                                    while (k < n && digits < 3 && content[k] >= '0' && content[k] <= '7')
                                    {
                                        oct += content[k];
                                        k++; digits++;
                                    }
                                    int code = Convert.ToInt32(oct, 8);
                                    lit.Append((char)code);
                                    j = k - 2; // adjust since j+=2 below
                                }
                                else
                                {
                                    lit.Append(esc);
                                }
                                break;
                        }
                        j += 2;
                    }
                    else if (cj == '(')
                    {
                        depth++;
                        lit.Append(cj);
                        j++;
                    }
                    else if (cj == ')')
                    {
                        depth--;
                        if (depth > 0) lit.Append(cj);
                        j++;
                    }
                    else
                    {
                        lit.Append(cj);
                        j++;
                    }
                }
                sb.Append(lit.ToString());
                i = j;
            }
            else if (c == 'T' && i + 1 < n && (content[i+1] == 'j' || content[i+1] == 'J'))
            {
                sb.Append(' ');
                i += 2;
            }
            else if (content.Length - i >= 2 && content.Substring(i, Math.Min(2, n - i)) == "T*")
            {
                sb.Append('\n');
                i += 2;
            }
            else if (c == 'T' && i + 1 < n && content[i+1] == 'd')
            {
                sb.Append('\n');
                i += 2;
            }
            else if (c == 'T' && i + 1 < n && content[i+1] == 'D')
            {
                sb.Append('\n');
                i += 2;
            }
            else
            {
                i++;
            }
        }

        return sb.ToString();
    }
}
'@

$text = [MiniPdfText]::Extract($PdfPath)
[System.IO.File]::WriteAllText($OutPath, $text, [System.Text.Encoding]::UTF8)
Write-Output "Extracted length: $($text.Length) chars -> $OutPath"
