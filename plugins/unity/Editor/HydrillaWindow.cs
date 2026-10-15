#if UNITY_EDITOR
using System;
using System.Collections;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

namespace Hydrilla
{
    public class HydrillaWindow : EditorWindow
    {
        const string PrefApiKey = "Hydrilla.ApiKey";
        const string PrefApiBase = "Hydrilla.ApiBase";
        const string PrefBridge = "Hydrilla.BridgeUrl";
        const string DefaultApi = "https://api.hydrilla.ai";
        const string DefaultBridge = "http://127.0.0.1:7345";

        string apiKey = "";
        string apiBase = DefaultApi;
        string bridgeUrl = DefaultBridge;
        string prompt = "";
        string imageUrl = "";
        string status = "Ready";
        bool busy;

        [MenuItem("Window/Hydrilla/Generate 3D")]
        public static void Open()
        {
            GetWindow<HydrillaWindow>("Hydrilla");
        }

        void OnEnable()
        {
            apiKey = EditorPrefs.GetString(PrefApiKey, "");
            apiBase = EditorPrefs.GetString(PrefApiBase, DefaultApi);
            bridgeUrl = EditorPrefs.GetString(PrefBridge, DefaultBridge);
        }

        void OnGUI()
        {
            EditorGUILayout.LabelField("Hydrilla", EditorStyles.boldLabel);
            apiKey = EditorGUILayout.PasswordField("API Key", apiKey);
            apiBase = EditorGUILayout.TextField("API Base", apiBase);
            bridgeUrl = EditorGUILayout.TextField("Bridge URL", bridgeUrl);

            if (GUILayout.Button("Save settings"))
            {
                EditorPrefs.SetString(PrefApiKey, apiKey);
                EditorPrefs.SetString(PrefApiBase, apiBase);
                EditorPrefs.SetString(PrefBridge, bridgeUrl);
                status = "Settings saved";
            }

            EditorGUILayout.Space();
            prompt = EditorGUILayout.TextField("Prompt", prompt);
            using (new EditorGUI.DisabledScope(busy || string.IsNullOrWhiteSpace(prompt)))
            {
                if (GUILayout.Button("Generate from Text"))
                {
                    EditorCoroutine.Start(GenerateText());
                }
            }

            imageUrl = EditorGUILayout.TextField("Image URL", imageUrl);
            using (new EditorGUI.DisabledScope(busy || string.IsNullOrWhiteSpace(imageUrl)))
            {
                if (GUILayout.Button("Generate from Image URL"))
                {
                    EditorCoroutine.Start(GenerateImage());
                }
            }

            EditorGUILayout.Space();
            using (new EditorGUI.DisabledScope(busy))
            {
                if (GUILayout.Button("Check Bridge"))
                {
                    EditorCoroutine.Start(CheckBridge());
                }
                if (GUILayout.Button("Import from Bridge"))
                {
                    EditorCoroutine.Start(ImportBridge());
                }
            }

            EditorGUILayout.HelpBox(status, MessageType.Info);
        }

        IEnumerator GenerateText()
        {
            busy = true;
            status = "Submitting text-to-3d…";
            var body = "{\"prompt\":" + JsonEscape(prompt) + "}";
            yield return PostJson(apiBase.TrimEnd('/') + "/v1/3d/text-to-3d", body, OnTaskCreated);
            busy = false;
        }

        IEnumerator GenerateImage()
        {
            busy = true;
            status = "Submitting image-to-3d…";
            var body = "{\"image_url\":" + JsonEscape(imageUrl) + "}";
            yield return PostJson(apiBase.TrimEnd('/') + "/v1/3d/image-to-3d", body, OnTaskCreated);
            busy = false;
        }

        IEnumerator OnTaskCreated(string json)
        {
            var id = ExtractJsonString(json, "id");
            if (string.IsNullOrEmpty(id))
            {
                status = "No task id returned";
                yield break;
            }
            yield return PollTask(id);
        }

        IEnumerator PollTask(string taskId)
        {
            while (true)
            {
                string response = null;
                yield return GetJson(apiBase.TrimEnd('/') + "/v1/3d/tasks/" + UnityWebRequest.EscapeURL(taskId), s => response = s);
                if (response == null)
                {
                    yield break;
                }
                var taskStatus = ExtractJsonString(response, "status");
                var progress = ExtractJsonNumber(response, "progress");
                status = taskStatus + " " + progress + "%";
                if (taskStatus == "SUCCEEDED")
                {
                    var meshUrl = ExtractNestedString(response, "result", "mesh_url");
                    if (!string.IsNullOrEmpty(meshUrl))
                    {
                        yield return DownloadAndImport(meshUrl, taskId);
                    }
                    yield break;
                }
                if (taskStatus == "FAILED" || taskStatus == "CANCELLED")
                {
                    status = ExtractJsonString(response, "error") ?? taskStatus;
                    yield break;
                }
                var resumeAt = EditorApplication.timeSinceStartup + 2.0;
                while (EditorApplication.timeSinceStartup < resumeAt)
                {
                    yield return null;
                }
            }
        }

        IEnumerator DownloadAndImport(string meshUrl, string stem)
        {
            status = "Downloading GLB…";
            var dir = Path.Combine(Application.dataPath, "Hydrilla");
            Directory.CreateDirectory(dir);
            var filePath = Path.Combine(dir, Sanitize(stem) + ".glb");
            using (var req = UnityWebRequest.Get(meshUrl))
            {
                yield return req.SendWebRequest();
                if (req.result != UnityWebRequest.Result.Success)
                {
                    status = req.error;
                    yield break;
                }
                File.WriteAllBytes(filePath, req.downloadHandler.data);
            }
            AssetDatabase.Refresh();
            status = "Imported Assets/Hydrilla/" + Path.GetFileName(filePath);
        }

        IEnumerator CheckBridge()
        {
            busy = true;
            string response = null;
            yield return GetJson(bridgeUrl.TrimEnd('/') + "/health", s => response = s, false);
            if (response != null)
            {
                status = "Bridge ok";
                yield return PostJson(bridgeUrl.TrimEnd('/') + "/register", "{\"app\":\"unity\",\"name\":\"Unity\"}", null, false);
            }
            busy = false;
        }

        IEnumerator ImportBridge()
        {
            busy = true;
            string response = null;
            yield return GetJson(bridgeUrl.TrimEnd('/') + "/pending?app=unity", s => response = s, false);
            if (response == null)
            {
                busy = false;
                yield break;
            }
            var meshUrl = ExtractFirstMeshUrl(response);
            var filePath = ExtractJsonString(response, "file_path");
            var id = ExtractFirstId(response);
            if (string.IsNullOrEmpty(meshUrl) && string.IsNullOrEmpty(filePath))
            {
                status = "Bridge idle";
                busy = false;
                yield break;
            }
            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
            {
                var dir = Path.Combine(Application.dataPath, "Hydrilla");
                Directory.CreateDirectory(dir);
                var dest = Path.Combine(dir, Sanitize(id ?? "bridge") + ".glb");
                File.Copy(filePath, dest, true);
                AssetDatabase.Refresh();
                status = "Imported Assets/Hydrilla/" + Path.GetFileName(dest);
            }
            else
            {
                yield return DownloadAndImport(meshUrl, id ?? "bridge");
            }
            if (!string.IsNullOrEmpty(id))
            {
                yield return PostJson(bridgeUrl.TrimEnd('/') + "/ack", "{\"id\":" + JsonEscape(id) + "}", null, false);
            }
            busy = false;
        }

        IEnumerator PostJson(string url, string body, Func<string, IEnumerator> next, bool auth = true)
        {
            var bytes = Encoding.UTF8.GetBytes(body);
            using (var req = new UnityWebRequest(url, "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(bytes);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.SetRequestHeader("Accept", "application/json");
                if (auth)
                {
                    req.SetRequestHeader("Authorization", "Bearer " + apiKey);
                }
                yield return req.SendWebRequest();
                if (req.result != UnityWebRequest.Result.Success)
                {
                    status = req.downloadHandler.text;
                    if (string.IsNullOrEmpty(status))
                    {
                        status = req.error;
                    }
                    yield break;
                }
                if (next != null)
                {
                    yield return next(req.downloadHandler.text);
                }
            }
        }

        IEnumerator GetJson(string url, Action<string> onOk, bool auth = true)
        {
            using (var req = UnityWebRequest.Get(url))
            {
                req.SetRequestHeader("Accept", "application/json");
                if (auth)
                {
                    req.SetRequestHeader("Authorization", "Bearer " + apiKey);
                }
                yield return req.SendWebRequest();
                if (req.result != UnityWebRequest.Result.Success)
                {
                    status = req.downloadHandler.text;
                    if (string.IsNullOrEmpty(status))
                    {
                        status = req.error;
                    }
                    yield break;
                }
                onOk?.Invoke(req.downloadHandler.text);
            }
        }

        static string JsonEscape(string value)
        {
            return "\"" + (value ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
        }

        static string Sanitize(string value)
        {
            var sb = new StringBuilder();
            foreach (var ch in value)
            {
                sb.Append(char.IsLetterOrDigit(ch) || ch == '-' || ch == '_' ? ch : '-');
            }
            return sb.ToString();
        }

        static string ExtractJsonString(string json, string key)
        {
            var token = "\"" + key + "\"";
            var idx = json.IndexOf(token, StringComparison.Ordinal);
            if (idx < 0) return null;
            idx = json.IndexOf(':', idx);
            if (idx < 0) return null;
            idx = json.IndexOf('"', idx + 1);
            if (idx < 0) return null;
            var end = json.IndexOf('"', idx + 1);
            if (end < 0) return null;
            return json.Substring(idx + 1, end - idx - 1);
        }

        static string ExtractJsonNumber(string json, string key)
        {
            var token = "\"" + key + "\"";
            var idx = json.IndexOf(token, StringComparison.Ordinal);
            if (idx < 0) return "0";
            idx = json.IndexOf(':', idx);
            if (idx < 0) return "0";
            idx++;
            while (idx < json.Length && char.IsWhiteSpace(json[idx])) idx++;
            var end = idx;
            while (end < json.Length && (char.IsDigit(json[end]) || json[end] == '.')) end++;
            return json.Substring(idx, end - idx);
        }

        static string ExtractNestedString(string json, string parent, string child)
        {
            var p = json.IndexOf("\"" + parent + "\"", StringComparison.Ordinal);
            if (p < 0) return null;
            return ExtractJsonString(json.Substring(p), child);
        }

        static string ExtractFirstMeshUrl(string json)
        {
            return ExtractJsonString(json, "mesh_url");
        }

        static string ExtractFirstId(string json)
        {
            return ExtractJsonString(json, "id");
        }
    }

    /// <summary>Tiny editor coroutine runner (no external package).</summary>
    static class EditorCoroutine
    {
        public static void Start(IEnumerator routine)
        {
            EditorApplication.CallbackFunction update = null;
            update = () =>
            {
                try
                {
                    if (routine != null && routine.MoveNext())
                    {
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogException(ex);
                }
                EditorApplication.update -= update;
            };
            EditorApplication.update += update;
        }
    }
}
#endif
