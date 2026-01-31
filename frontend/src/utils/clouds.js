// This file is auto-generated from config/metrics.yaml for frontend use.
// Only AWS is included for now, but you can expand as needed.

export const CLOUDS = [
  {
    name: 'AWS',
    collectors: [
      {
        type: 'ec2',
        display: 'EC2',
        fields: ['instance_id']
      },
      {
        type: 's3',
        display: 'S3',
        fields: ['bucket_name']
      },
      {
        type: 'lambda',
        display: 'Lambda',
        fields: ['function_name']
      }
    ]
  }
  // Add more clouds here if needed
];
