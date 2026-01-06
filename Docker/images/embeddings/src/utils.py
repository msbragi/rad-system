import os
import torch


def get_device():
    """
    Universal device selector based on USE_GPU env variable.
    USE_GPU values:
      - NONE (or not set): CPU
      - CUDA: NVidia/compatible (torch.device('cuda'))
      - ROCm: AMD/compatible (torch.device('cuda') with ROCm)
      - MPS: Apple Silicon (torch.device('mps'))
    Fallbacks to CPU if requested device is unavailable.
    """
    use_gpu = os.getenv('FASTAPI_GPU', 'NONE').upper()
    if use_gpu == 'CUDA':
        if torch.cuda.is_available():
            return torch.device('cuda')
        else:
            print('[WARN] CUDA requested but not available, using CPU.')
            return torch.device('cpu')
    elif use_gpu == 'ROCM':
        # ROCm is exposed as 'cuda' device, but torch.version.hip must be present
        if hasattr(torch.version, 'hip') and torch.version.hip and torch.cuda.is_available():
            return torch.device('cuda')
        else:
            print('[WARN] ROCm requested but not available, using CPU.')
            return torch.device('cpu')
    elif use_gpu == 'MPS':
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return torch.device('mps')
        else:
            print('[WARN] MPS requested but not available, using CPU.')
            return torch.device('cpu')
    else:
        # NONE or unknown value
        return torch.device('cpu')
