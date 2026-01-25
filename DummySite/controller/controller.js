const k8s = require('@kubernetes/client-node');
const axios = require('axios');

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

const GROUP = 'stable.example.com';
const VERSION = 'v1';
const PLURAL = 'dummysites';
const NAMESPACE = process.env.NAMESPACE || 'default';

console.log('🚀 DummySite Controller starting...');

// Fetch website content
async function fetchWebsiteContent(url) {
  try {
    console.log(`📥 Fetching content from ${url}`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'DummySite-Controller/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}:`, error.message);
    return `<html><body><h1>Error fetching ${url}</h1><p>${error.message}</p></body></html>`;
  }
}

// Create ConfigMap with website content
async function createConfigMap(name, content) {
  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: `${name}-content`,
      labels: {
        app: name,
        'managed-by': 'dummysite-controller'
      }
    },
    data: {
      'index.html': content
    }
  };

  try {
    await k8sApi.createNamespacedConfigMap(NAMESPACE, configMap);
    console.log(`✅ Created ConfigMap: ${name}-content`);
  } catch (error) {
    if (error.response && error.response.statusCode === 409) {
      // Already exists, update it
      await k8sApi.replaceNamespacedConfigMap(`${name}-content`, NAMESPACE, configMap);
      console.log(`✅ Updated ConfigMap: ${name}-content`);
    } else {
      throw error;
    }
  }
}

// Create Deployment to serve the website
async function createDeployment(name) {
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: name,
      labels: {
        app: name,
        'managed-by': 'dummysite-controller'
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: name
        }
      },
      template: {
        metadata: {
          labels: {
            app: name
          }
        },
        spec: {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:alpine',
              ports: [
                {
                  containerPort: 80,
                  name: 'http'
                }
              ],
              volumeMounts: [
                {
                  name: 'content',
                  mountPath: '/usr/share/nginx/html'
                }
              ]
            }
          ],
          volumes: [
            {
              name: 'content',
              configMap: {
                name: `${name}-content`
              }
            }
          ]
        }
      }
    }
  };

  try {
    await k8sAppsApi.createNamespacedDeployment(NAMESPACE, deployment);
    console.log(`✅ Created Deployment: ${name}`);
  } catch (error) {
    if (error.response && error.response.statusCode === 409) {
      // Already exists
      console.log(`ℹ️  Deployment ${name} already exists`);
    } else {
      throw error;
    }
  }
}

// Create Service to expose the deployment
async function createService(name) {
  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: name,
      labels: {
        app: name,
        'managed-by': 'dummysite-controller'
      }
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        app: name
      },
      ports: [
        {
          port: 80,
          targetPort: 'http',
          protocol: 'TCP',
          name: 'http'
        }
      ]
    }
  };

  try {
    await k8sApi.createNamespacedService(NAMESPACE, service);
    console.log(`✅ Created Service: ${name}`);
  } catch (error) {
    if (error.response && error.response.statusCode === 409) {
      // Already exists
      console.log(`ℹ️  Service ${name} already exists`);
    } else {
      throw error;
    }
  }
}

// Create Ingress to expose the service
async function createIngress(name) {
  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: name,
      labels: {
        app: name,
        'managed-by': 'dummysite-controller'
      },
      annotations: {
        'nginx.ingress.kubernetes.io/rewrite-target': '/'
      }
    },
    spec: {
      rules: [
        {
          http: {
            paths: [
              {
                path: `/${name}`,
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: name,
                    port: {
                      number: 80
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  };

  try {
    await k8sNetworkingApi.createNamespacedIngress(NAMESPACE, ingress);
    console.log(`✅ Created Ingress: ${name}`);
  } catch (error) {
    if (error.response && error.response.statusCode === 409) {
      // Already exists
      console.log(`ℹ️  Ingress ${name} already exists`);
    } else {
      throw error;
    }
  }
}

// Update DummySite status
async function updateStatus(name, phase, url) {
  try {
    const patch = {
      status: {
        phase: phase,
        url: url
      }
    };

    await customObjectsApi.patchNamespacedCustomObjectStatus(
      GROUP,
      VERSION,
      NAMESPACE,
      PLURAL,
      name,
      patch,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`✅ Updated status for ${name}: ${phase}`);
  } catch (error) {
    console.error(`❌ Failed to update status:`, error.message);
  }
}

// Process a DummySite resource
async function processDummySite(dummysite) {
  const name = dummysite.metadata.name;
  const websiteUrl = dummysite.spec.website_url;

  console.log(`\n🔄 Processing DummySite: ${name}`);
  console.log(`   URL: ${websiteUrl}`);

  try {
    // Update status to Processing
    await updateStatus(name, 'Processing', '');

    // Fetch website content
    const content = await fetchWebsiteContent(websiteUrl);

    // Create resources
    await createConfigMap(name, content);
    await createDeployment(name);
    await createService(name);
    await createIngress(name);

    // Update status to Ready
    const accessUrl = `http://localhost/${name}`;
    await updateStatus(name, 'Ready', accessUrl);

    console.log(`✅ Successfully processed DummySite: ${name}`);
    console.log(`   Access at: ${accessUrl}`);
  } catch (error) {
    console.error(`❌ Error processing DummySite ${name}:`, error.message);
    await updateStatus(name, 'Failed', '');
  }
}

// Watch for DummySite resources
async function watchDummySites() {
  console.log(`👀 Watching DummySites in namespace: ${NAMESPACE}`);

  const watch = new k8s.Watch(kc);
  
  const onEvent = async (phase, obj) => {
    if (phase === 'ADDED' || phase === 'MODIFIED') {
      console.log(`\n📢 Event: ${phase} - ${obj.metadata.name}`);
      await processDummySite(obj);
    }
  };

  const onDone = (err) => {
    if (err) {
      console.error('❌ Watch error:', err.message);
    }
    console.log('🔄 Restarting watch...');
    setTimeout(watchDummySites, 5000);
  };

  try {
    await watch.watch(
      `/apis/${GROUP}/${VERSION}/namespaces/${NAMESPACE}/${PLURAL}`,
      {},
      onEvent,
      onDone
    );
  } catch (error) {
    console.error('❌ Failed to start watch:', error.message);
    setTimeout(watchDummySites, 5000);
  }
}

// Process existing DummySites on startup
async function processExistingDummySites() {
  try {
    console.log('🔍 Processing existing DummySites...');
    const response = await customObjectsApi.listNamespacedCustomObject(
      GROUP,
      VERSION,
      NAMESPACE,
      PLURAL
    );

    const dummysites = response.body.items;
    console.log(`   Found ${dummysites.length} existing DummySite(s)`);

    for (const dummysite of dummysites) {
      await processDummySite(dummysite);
    }
  } catch (error) {
    console.error('❌ Error processing existing DummySites:', error.message);
  }
}

// Main function
async function main() {
  try {
    await processExistingDummySites();
    await watchDummySites();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main();